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

    constructor(name, dueDate = new Date().toISOString(), priority = 1, note) {
        this.name = name;
        this.dueDate = dueDate;
        this.priority = priority;
        this.note = note;
        this.isComplete = false;
    }

    update(newName, newStatus, newDate, newNote, newPriority) {
        this.rename(newName);
        this.addNote(newNote);
        this.updatePriority(newPriority);
        this.updateDueDate(newDate);
        this.updateStatus(newStatus);

    }

    updateStatus(newStatus) {
        this.isComplete = newStatus || this.isComplete;
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
            this.tasks.splice(id, 1);
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

class Projects {
    projects = [new Project("Default")];
    defaultName() {
        let digit = this.projects.length;
        return `Default${digit === 0 ? "" : ' ' + digit}`;
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
    addTask(name = '', note = '', priority = 1, date, id = 0) {
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
        console.log(this.#getProject(projectid));
        this.#getProject(projectid).getTasks(taskid).delete(taskid);
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
}