import { format } from "date-fns";
class List {
    constructor() {
        this.list = [];
    }
    add(newItem) {
        this.list.push({ listName: newItem, isComplete: false });
    }
    update(id, name, isComplete = null) {
        this.list[id].listName = name || this.list[id].listName;
        this.list[id].isComplete = isComplete ?? this.list[id].isComplete;
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
        })
        PubSub.subscribe('Open_Project', (msg, data) => {
            PubSub.publish('Render_Tasks', { tasks: this.getAllTasks(data.id).tasks, projectId: data.id });
        })
        PubSub.subscribe('Add_Task', (msg, data) => {
            this.addTask(data.id);
            PubSub.publish('Render_Tasks', { tasks: this.getAllTasks(data.id).tasks, projectId: data.id })
            PubSub.publish('Display_Modal', { task: this.getAllTasks(data.id).tasks.at(-1), projects: this.projects });
        })
        PubSub.subscribe('Delete_Task', (msg, data) => {
            this.deleteTask(data.projectId, data.taskId);
            PubSub.publish('Render_Tasks', { tasks: this.getAllTasks(data.projectId).tasks, projectId: data.projectId });
            PubSub.publish('Close_Modal', {});
        })
        PubSub.subscribe('Update_Task', (msg, data) => {
            this.updateTask(data.projectId, data.taskId, data.name, data.status, data.date, data.description, data.taskPriority);
            PubSub.publish('Render_Tasks', { tasks: this.getAllTasks(data.projectId).tasks, projectId: data.projectId })
        })
        PubSub.subscribe('Open_Task', (msg, data) => {
            PubSub.publish('Display_Modal', { task: this.getAllTasks(data.projectId).tasks.at(data.taskId), projects: this.projects });
        })
        PubSub.subscribe('Change_Task_Project', (msg, { newId, oldId, taskId }) => {
            this.moveTask({ newId, oldId }, taskId);
        });
        PubSub.subscribe('All_Tasks', (msg, data) => {
            this.allTasks();
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

    moveTask(projectid, taskid) {
        const task = this.deleteTask(projectid.oldId, taskid);
        const project = this.projects[projectid.newId]
        project.todo.tasks.push(task);
        PubSub.publish('Open_Project', { id: projectid.oldId });
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

    allTasks() {
        this.projects.forEach((project, i, _) => {
            PubSub.publish("Render_All_Tasks", { tasks: project.todo.tasks, projectId: i });
        })
        PubSub.publish("All_Tasks_Rendered", {});
    }
}