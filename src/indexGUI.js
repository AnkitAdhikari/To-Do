import './style.css';

import PubSub from 'pubsub-js'


new class GUI {
    constructor() {
        this.currentActiveProjectId = 0;
        this.view = 'allTasks';
        this.currentActiveTask = null;
        this.viewsTab = true;
        this.projectChanged = false;

        this.modal = document.createElement('dialog');
        this.cacheStaticDOM();
        this.bindStaticEvent();
        PubSub.subscribe('Render_Projects', (msg, data) => {
            this.renderProjects(data);
        })
        PubSub.subscribe('Render_Tasks', (msg, data) => {
            this.renderTasks(data);
        })
        PubSub.subscribe('Display_Modal', (msg, data) => {
            this.projects = data.projects;
            this.showModal(data.task, data.projects);
        })
        PubSub.subscribe('Close_Modal', (msg, data) => this.modal.close());
        PubSub.subscribe("Render_All_Tasks", (msg, { tasks, projectId }) => {
            this.renderTasks({ tasks, projectId, multi: true });
        })
    }

    cacheStaticDOM() {
        this.projectListContainer = document.getElementById('project-list-container')
        this.content = document.querySelector('.content');
        this.allTasks = document.querySelector('.all-tasks');
        this.todayTasks = document.querySelector('.today-tasks');
        this.weekTasks = document.querySelector('.week-tasks');
        this.highAlertTasks = document.querySelector('.high-alert-tasks');
    }

    cacheDynamicProjectDOM() {
        this.addProjectBtn = document.querySelector('.add-project-btn');
        this.projectNameField = document.querySelectorAll('.project-name')
        this.projectDeleteBtn = document.querySelectorAll('.project-del-btn')
        this.projects = document.querySelectorAll('.project')
    }

    cacheDynamicTaskDOM() {
        this.addTaskBtn = document.querySelector('.add-task-btn');
        this.tasks = document.querySelectorAll('.task');
        this.taskExpandBtns = document.querySelectorAll('.task-expand-btn');
        this.taskIsDoneBtns = document.querySelectorAll('.task-is-done');
    }
    cacheModalDOM() {
        this.closeModalBtn = document.querySelector('.close-modal-btn')
        this.deleteTaskBtn = document.querySelector('.task-del-btn');
        this.taskisCompleted = document.querySelector('.task-isCompleted');
        this.taskName = document.querySelector('.task-name');
        this.taskDescription = document.querySelector('.task-description')
        this.taskDate = document.querySelector('.task-Due-date');
        this.priorityBtns = document.querySelectorAll('.task-priority');
        this.priorityDivs = document.querySelector('.priorityDivs');
        this.projectOpt = document.querySelector('.project-opt')
    }

    bindStaticEvent() {
        this.allTasks.addEventListener('click', () => {
            this.content.innerHTML = '';
            this.view = 'allTasks';
            PubSub.publish('All_Tasks', {});
        })
        this.todayTasks.addEventListener('click', () => {
            this.content.innerHTML = '';
            this.view = 'todayTasks';
            PubSub.publish('Today_Tasks', {});
        })
        this.weekTasks.addEventListener('click', () => {
            this.content.innerHTML = '';
            this.view = 'weekTasks';
            PubSub.publish('Week_Tasks', {});
        })
        this.highAlertTasks.addEventListener('click', () => {
            this.content.innerHTML = '';
            this.view = 'highAlertTasks'
            PubSub.publish('High_Alert_Tasks', {});
        })
    }

    bindProjectEvent() {
        this.addProjectBtn.addEventListener('click', this.addProject.bind(this));
        this.projectNameField.forEach(project => project.addEventListener('input', this.renameProject.bind(this)));
        this.projectDeleteBtn.forEach(project => project.addEventListener('click', this.deleteProject.bind(this)));
        this.projects.forEach(project => project.addEventListener('click', this.openProject.bind(this)));
    }

    bindTaskEvent() {
        this.addTaskBtn.addEventListener('click', this.addTask.bind(this));
        this.taskExpandBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const taskId = e.target.dataset.taskid;
                const projectId = e.target.dataset.projectid;
                this.currentActiveProjectId = projectId;
                PubSub.publish('Open_Task', { taskId, projectId })
            })
        })
        this.taskIsDoneBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const projectId = e.currentTarget.dataset.projectid;
                const taskId = e.currentTarget.dataset.taskid;
                PubSub.publish('Update_Task', { status: btn.checked, projectId, taskId, view: this.view });
            })
        })
    }

    bindModalEvent() {
        this.closeModalBtn.addEventListener('click', () => {
            const newId = this.projectOpt.value
            const oldId = this.closeModalBtn.dataset.projectid;
            if (this.projectChanged) {
                PubSub.publish('Change_Task_Project', { newId, oldId, taskId: this.currentActiveTask, viewsTab: this.viewsTab });
            }
            this.projectChanged = false;
            this.modal.close();
        })
        this.deleteTaskBtn.addEventListener('click', this.deleteTask.bind(this));
        [this.taskisCompleted, this.taskName, this.taskDescription, this.taskDate].forEach(el => el.addEventListener('input', (e) => {
            PubSub.publish('Update_Task', { name: this.taskName.value, status: this.taskisCompleted.checked, description: this.taskDescription.value, projectId: this.currentActiveProjectId, taskId: +this.taskName.dataset.taskid, date: this.taskDate.value, view: this.view });
        }))
        this.priorityBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                PubSub.publish('Update_Task', { name: this.taskName.value, status: this.taskisCompleted.checked, description: this.taskDescription.value, projectId: this.currentActiveProjectId, taskId: +this.taskName.dataset.taskid, date: this.taskDate.value, taskPriority: btn.textContent, view: this.view })
                this.priorityDivs.querySelector('.active').classList.remove('active');
                btn.classList.add('active');
            })
        })
        this.projectOpt.addEventListener('input', () => {
            this.projectChanged = true;
        })
    }

    addProject() {
        PubSub.publish('Add_Project', {});
    }

    renameProject(e) {
        const id = e.target.dataset.projectid;
        const newName = e.target.value;
        PubSub.publish('Rename_Project', { newName, id });
    }

    deleteProject(e) {
        const id = e.target.dataset.projectid;
        PubSub.publish('Delete_Project', { id });
        this.currentActiveProjectId = 0;
    }

    openProject(e) {
        if (e.target === e.currentTarget) {
            this.view = null;
            this.viewsTab = false;
            const id = e.currentTarget.dataset.projectid;
            this.updateCurrentActiveProject(id);
            PubSub.publish('Open_Project', { id })
        }
    }

    updateCurrentActiveProject(id) {
        this.currentActiveProjectId = id;
    }

    addTask() {
        PubSub.publish('Add_Task', { id: this.currentActiveProjectId, view: this.view });
    }

    showModal(task, projects) {
        this.modal.innerHTML = '';
        this.modal.insertAdjacentHTML('afterbegin', ` <div class="modal">
        <div class="modal-head">
          <ion-icon
            data-projectID="${this.currentActiveProjectId}"
            data-taskID="${task.id}"
            name="trash"
            class="task-del-btn"
          ></ion-icon>
          <ion-icon class="close-modal-btn" data-projectID="${this.currentActiveProjectId}"
          data-taskID="${task.id}" name="close-circle-outline"></ion-icon>
        </div>
        <div class="modal-body">
          <div class="modal-left">
            <div class="tasks-content">
              <div>
                <input ${task.isComplete ? "checked" : ''} class="task-isCompleted" data-projectID="${this.currentActiveProjectId}"
                data-taskID="${task.id}" type="checkbox" name="" id="" /><input
                data-projectID="${this.currentActiveProjectId}"
            data-taskID="${task.id}"
                class="task-name"
                  type="text"
                 value="${task.name}"
                  placeholder="Task Name"
                />
              </div>
              <div>
                <ion-icon name="newspaper-outline"></ion-icon>
                <textarea data-projectID="${this.currentActiveProjectId}"
                data-taskID="${task.id}"
                  style="resize: none"
                  class="task-description"
                  placeholder="Your description"
                >${task.note}</textarea>
              </div>
            </div>
            <div class="lists-content">
              <div class="heading">
                <ion-icon name="list-outline"></ion-icon> Checklist
              </div>
              <ul class="lists"></ul>
            </div>
          </div>
          <div class="modal-right">
            <div>
              <p>Project</p>
              <select class="project-opt">
              ${projects.map((project, i, _) => {
            return `<option data-taskid="${task.id}" ${i == this.currentActiveProjectId ? 'selected' : ''} value="${i}">${project.name}</option>`
        }).join(' ')}
              </select>
            </div>
            <div>
              <p>Due Date</p>
              <input
                class="task-Due-date"
                type="date"
                name=""
                id=""
                value="${task.dueDate}"
              />
            </div>
            <div>
              <p>Priority</p>
              <div class="priorityDivs">
                <div data-projectID="${this.currentActiveProjectId}"
                data-taskID="${task.id}" class="task-priority ${1 == task.priority ? "active" : ''}" style="background-color: teal">1</div>
                <div data-projectID="${this.currentActiveProjectId}"
            data-taskID="${task.id}" class="task-priority ${2 == task.priority ? "active" : ''}" style="background-color: green">2</div>
                <div data-projectID="${this.currentActiveProjectId}"
            data-taskID="${task.id}" class="task-priority ${3 == task.priority ? "active" : ''}" style="background-color: goldenrod">3</div>
                <div data-projectID="${this.currentActiveProjectId}"
            data-taskID="${task.id}" class="task-priority ${4 == task.priority ? "active" : ''}" style="background-color: burlywood">4</div>
                <div data-projectID="${this.currentActiveProjectId}"
            data-taskID="${task.id}" class="task-priority ${5 == task.priority ? "active" : ''}" style="background-color: brown">5</div>
              </div>
            </div>
          </div>
        </div>
      </div>`);
        this.content.insertAdjacentElement('afterend', this.modal);
        this.modal.showModal();
        this.cacheModalDOM();
        this.bindModalEvent();
        this.currentActiveTask = task.id;
    }

    deleteTask(e) {
        const projectId = +e.target.dataset.projectid;
        const taskId = +e.target.dataset.taskid;
        PubSub.publish('Delete_Task', { projectId, taskId, view: this.view })
    }

    renderProjects(projects) {
        this.projectListContainer.innerHTML = '';
        projects.forEach((project, id, _) => {
            this.projectListContainer.insertAdjacentHTML('beforeend', `<li class="nav-list project" data-projectID="${id}">
            <ion-icon name="grid" class="nav-icon"></ion-icon
            ><input class="project-name" ${id === 0 ? 'readonly' : ''} data-projectID="${id}" type="text" value="${project.name}" />
            <ion-icon data-projectID="${id}" name="trash" class="project-del-btn"></ion-icon>
          </li>`)
        });
        this.appendAddProjectBtn();
        this.cacheDynamicProjectDOM();
        this.bindProjectEvent();
    }
    appendAddProjectBtn() {
        this.projectListContainer.insertAdjacentHTML('beforeend', `<li class="add-project-btn">Add +</li>`)
    }

    renderTasks({ tasks, projectId = false }) {
        if (!projectId) {
            this.setDefaultView();
        }
        this.content.innerHTML = '';
        tasks.forEach(task => {
            this.content.insertAdjacentHTML('beforeend', `          <div
            class="task"
            data-task-id="${task.id}"
          >
            <input ${task.isComplete ? "checked" : ''} type="checkbox" data-projectid=${projectId || task.projectId} data-taskid=${task.id} name="is-completed" class="task-is-done" />
            <h3 class="task-title">${task.name}</h3>
            <ion-icon data-taskid=${task.id} data-projectid=${projectId || task.projectId} name="expand-outline" class="task-expand-btn"></ion-icon>
            <h3 class="task-date">${task.dueDate}</h3>
          </div>`);
        })
        this.appendAddTaskBtn();
        this.cacheDynamicTaskDOM();
        this.bindTaskEvent();
    }

    setDefaultView() {
        this.viewsTab = true;
        this.currentActiveProjectId = 0;
    }

    appendAddTaskBtn(defaultProject = false) {
        this.content.insertAdjacentHTML('beforeend', `<div class="add-task-btn" data-projecid="${defaultProject ? 0 : this.currentActiveProjectId}" >Add +</div>`)
    }

}
