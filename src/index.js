import { format, isThisWeek, isToday, toDate } from "date-fns";
class List {
    constructor() {
        this.list = [];
    }
    add(newItem) {
        this.list.push({ listName: newItem, isComplete: false });
    }
    update(id, name, isComplete) {
        this.list[id].listName = name || this.list[id].listName;
        this.list[id].isComplete = isComplete;
    }
    delete(id) {
        if (id >= 0 && id < this.list.length)
            this.list.splice(id, 1);
    }
}

class Task {

    note;
    checkList = new List();

    constructor(name, dueDate = format(new Date(), "yyyy-MM-dd"), priority = 1, note, id) {
        this.name = name;
        this.dueDate = dueDate;
        this.priority = priority;
        this.note = note;
        this.isComplete = false;
        this.id = id
    }

    update(newName, newStatus, newDate, newNote, newPriority) {
        this.rename(newName);
        this.addNote(newNote);
        this.updatePriority(newPriority);
        this.updateDueDate(newDate);
        this.updateStatus(newStatus);

    }

    updateStatus(newStatus) {
        this.isComplete = newStatus
    }

    rename(newName) {
        this.name = newName || this.name;
    }

    addNote(note) {
        this.note = note || this.note;
    }

    updatePriority(newPriority) {
        if (newPriority >= 1 && newPriority <= 5)
            this.priority = newPriority || this.priority;
    }

    updateDueDate(newDate) {
        this.dueDate = newDate || this.dueDate;
    }
}

class Tasks {
    tasks = [];
    add(name, date, priority, note) {
        this.tasks.push(new Task(name, date, priority, note, this.tasks.length));
    }
    delete(id) {
        if (id >= 0 && id < this.tasks.length) {
            const deleated = this.tasks.splice(id, 1);
            this.tasks.forEach((task, i, _) => task.id = i);
            return deleated[0];
        }
    }
}

class Project {
    todo = new Tasks();
    constructor(name) {
        this.name = name;
    }
    rename(newName) {
        this.name = newName;
    }
    getTask(id) {
        return this.todo.tasks[id];
    }
    getTasks() {
        return this.todo;
    }
}

new class Projects {
    projects = [new Project("Default")];
    constructor() {
        PubSub.publish('Render_Projects', this.projects);
        PubSub.subscribe('Add_Project', (msg, data) => {
            this.add();
            PubSub.publish('Render_Projects', this.projects);
        })
        PubSub.subscribe('Rename_Project', (msg, data) => {
            this.renameProject(+data.id, data.newName);
        });
        PubSub.subscribe('Delete_Project', (msg, data) => {
            this.delete(+data.id);
            PubSub.publish('Render_Projects', this.projects);
            PubSub.publish('Render_Tasks', { tasks: this.getAllTasks(0).tasks, projectId: 0 })
        })
        PubSub.subscribe('Open_Project', (msg, data) => {
            PubSub.publish('Render_Tasks', { tasks: this.getAllTasks(data.id).tasks, projectId: data.id });
        })
        PubSub.subscribe('Add_Task', (msg, data) => {
            this.addTask(data.id);
            if (data.view) {
                this.runViewTabHandler(data.view);
            } else {
                PubSub.publish('Render_Tasks', { tasks: this.getAllTasks(data.id).tasks, projectId: data.id })
            }
            PubSub.publish('Display_Modal', { task: this.getAllTasks(data.id).tasks.at(-1), projects: this.projects });
        })
        PubSub.subscribe('Delete_Task', (msg, data) => {
            this.deleteTask(data.projectId, data.taskId);
            if (data.view) {
                this.runViewTabHandler(data.view);
            } else {
                PubSub.publish('Render_Tasks', { tasks: this.getAllTasks(data.id).tasks, projectId: data.id })
            }
            PubSub.publish('Close_Modal', {});
        })
        PubSub.subscribe('Update_Task', (msg, data) => {
            this.updateTask(data.projectId, data.taskId, data.name, data.status, data.date, data.description, data.taskPriority);
            if (data.view) {
                this.runViewTabHandler(data.view);
            }
            else {
                PubSub.publish('Render_Tasks', { tasks: this.getAllTasks(data.projectId).tasks, projectId: data.projectId })
            }
        })
        PubSub.subscribe('Open_Task', (msg, data) => {
            PubSub.publish('Display_Modal', { task: this.getAllTasks(data.projectId).tasks.at(data.taskId), projects: this.projects });
        })
        PubSub.subscribe('Change_Task_Project', (msg, { newId, oldId, taskId, viewsTab }) => {
            console.log(this.projects);
            this.moveTask({ newId, oldId }, taskId, viewsTab);
            console.log(this.projects);
        });
        PubSub.subscribe('All_Tasks', (msg, data) => {
            this.allTasks();
        })
        PubSub.subscribe('Today_Tasks', (msg, data) => {
            this.todayTasks();
        })
        PubSub.subscribe('Week_Tasks', (msg, data) => {
            this.weekTasks();
        })
        PubSub.subscribe("High_Alert_Tasks", (msg, data) => {
            this.highAlertTasks();
        })
        PubSub.subscribe('Add_List', (msg, data) => {

            this.addList(data.projectId, data.taskId, '');
            let lists = this.getList(data.projectId, data.taskId);
            let task = this.getAllTasks(data.projectId).tasks[`${data.taskId}`];
            PubSub.publish("Render_List", { lists, task, newAdded: true })
        })
        PubSub.subscribe('Update_List', (msg, data) => {
            this.updateList(data.projectId, data.taskId, data.listId, data.newName, data.newStatus);
            let lists = this.getList(data.projectId, data.taskId);
            let task = this.getAllTasks(data.projectId).tasks[`${data.taskId}`];
            if (!data.noRender) {
                PubSub.publish('Render_List', { lists, task })
            }
        })
        PubSub.subscribe('Delete_List', (msg, data) => {
            this.deleteList(data.projectId, data.taskId, data.listId);
            let lists = this.getList(data.projectId, data.taskId);
            let task = this.getAllTasks(data.projectId).tasks[`${data.taskId}`];
            PubSub.publish('Render_List', { lists, task });
        })
    }
    defaultName() {
        let digit = this.projects.length;
        return `new project${digit === 0 ? "" : ''}`;
    }
    #getProject(id) {
        if (id >= 0 && id < this.projects.length)
            return this.projects[id];
    }
    add(name = this.defaultName()) {
        this.projects.push(new Project(name, this.projects.length));
    }
    renameProject(id, newName) {
        this.#getProject(id).rename(newName);
    }
    delete(id) {
        if (id > 0 && id < this.projects.length) {
            this.projects.splice(id, 1);
        }
    }

    getAllTasks(projectId) {
        const project = this.#getProject(projectId);
        return project.getTasks();
    }

    addTask(id = 0, name = '', note = '', priority = 1, date) {
        if (id >= 0 && id < this.projects.length) {
            if (id === 0) {
                this.projects[0].todo.add(name, date, priority, note)
            } else {
                this.projects[id].todo.add(name, date, priority, note);
            }
        }
    }
    updateTask(projectid, taskid, newName, newStatus, newDate, newNote, newPriority) {
        let task = this.#getProject(projectid).getTask(taskid);
        task.update(newName, newStatus, newDate, newNote, newPriority)
    }
    deleteTask(projectid, taskid) {
        return this.#getProject(projectid).getTasks(taskid).delete(taskid);
    }

    moveTask(projectid, taskid, viewsTab) {
        const task = this.deleteTask(projectid.oldId, taskid);
        const project = this.projects[projectid.newId];
        task.id = project.todo.tasks.length;
        project.todo.tasks.push(task);
        if (viewsTab) {

        } else {
            PubSub.publish('Open_Project', { id: projectid.oldId });
        }
    }

    addList(projectid, taskid, name) {
        this.#getProject(projectid).getTask(taskid).checkList.add(name);
    }
    updateList(projectid, taskid, listid, name, isComplete) {
        this.#getProject(projectid).getTask(taskid).checkList.update(listid, name, isComplete)
    }
    deleteList(projectid, taskid, listid) {
        this.#getProject(projectid).getTask(taskid).checkList.delete(listid);
    }
    getList(projectid, taskid) {
        return this.#getProject(projectid).getTask(taskid).checkList.list
    }

    allTasks() {
        let tasks = [];
        let projects = this.projects.slice(0);
        projects.forEach((project, i, _) => {
            project.todo.tasks.forEach(task => {
                task.projectId = i
            })
            tasks.push(project.todo.tasks);
            console.log(tasks)
        })
        console.log(tasks);
        tasks = tasks.flat();
        PubSub.publish("Render_Tasks", { tasks });
    }
    todayTasks() {
        let tasks = [];
        let projects = this.projects.slice(0);
        projects.forEach((project, i, _) => {
            tasks.push(project.todo.tasks.filter(task => {
                task.projectId = i;
                return isToday(task.dueDate)
            }));
        })
        tasks = tasks.flat();
        PubSub.publish("Render_Tasks", { tasks });
    }
    weekTasks() {
        let tasks = [];
        let projects = this.projects.slice(0);
        projects.forEach((project, i, _) => {
            tasks.push(project.todo.tasks.filter(task => {
                task.projectId = i;
                return isThisWeek(task.dueDate)
            }));
        })
        tasks = tasks.flat();
        PubSub.publish("Render_Tasks", { tasks });
    }
    highAlertTasks() {
        let tasks = [];
        let projects = this.projects.slice(0);
        projects.forEach((project, i, _) => {
            tasks.push(project.todo.tasks.filter(task => {
                task.projectId = i;
                return task.priority > 3;
            }));
        })
        tasks = tasks.flat();
        PubSub.publish("Render_Tasks", { tasks });
    }

    runViewTabHandler(view) {
        if (view === 'allTasks')
            PubSub.publish('All_Tasks', {});

        if (view === 'todayTasks')
            PubSub.publish('Today_Tasks', {});

        if (view === 'weekTasks')
            PubSub.publish('Week_Tasks', {});

        if (view === 'highAlertTasks')
            PubSub.publish('High_Alert_Tasks', {});
    }
}