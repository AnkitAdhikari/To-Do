import './style.css';

import PubSub from 'pubsub-js'


new class GUI {
    constructor() {
        this.cacheStaticDOM();
        PubSub.subscribe('All_Projects', (msg, data) => {
            console.log(data)
            this.renderProjects(data);
        })
        PubSub.subscribe('Project_Added', (msg, data) => {
            this.renderProjects(data);
        });

    }

    cacheStaticDOM() {
        this.projectListContainer = document.getElementById('project-list-container')
    }

    cacheDynamicDOM() {
        this.addProjectBtn = document.querySelector('.add-project-btn');
        this.projectNameField = document.querySelectorAll('.project-name')
        this.projectDeleteBtn = document.querySelectorAll('.project-del-btn')
    }

    bindEvent() {
        this.addProjectBtn.addEventListener('click', this.addProject.bind(this));
        this.projectNameField.forEach(project => project.addEventListener('input', this.renameProject.bind(this)));
        this.projectDeleteBtn.forEach(project => project.addEventListener('click', this.deleteProject.bind(this)));

    }

    addProject() {
        PubSub.publish('Add_Project', {});
    }

    renameProject(e) {
        console.log(e.target);
        const id = e.target.dataset.projectid;
        const newName = e.target.value;
        PubSub.publish('Rename_Project', { newName, id });
    }

    deleteProject(e) {
        const id = e.target.dataset.projectid;
        PubSub.publish('Delete_Project', { id });
    }


    renderProjects(projects) {
        this.projectListContainer.innerHTML = '';
        projects.forEach((project, id, _) => {
            this.projectListContainer.insertAdjacentHTML('beforeend', `<li class="nav-list">
            <ion-icon name="grid" class="nav-icon"></ion-icon
            ><input class="project-name" ${id === 0 ? 'readonly' : ''} data-projectID="${id}" type="text" value="${project.name}" />
            <ion-icon data-projectID="${id}" name="trash" class="project-del-btn"></ion-icon>
          </li>`)
        });
        this.appendAddProjectBtn();
        this.cacheDynamicDOM();
        this.bindEvent();
    }
    appendAddProjectBtn() {
        this.projectListContainer.insertAdjacentHTML('beforeend', `<li class="add-project-btn">Add +</li>`)
    }
}
