class List {
    constructor() {
        this.list = [];
    }
    add(newItem) {
        this.list.push({ listName: newItem, isComplete: false });
    }
    update(id, name, isComplete) {
        name = name || this.list[id].name;
        this.list[id].listName = name;
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

    constructor(name, dueDate = new Date().toISOString(), priority = 1) {
        this.name = name;
        this.dueDate = dueDate;
        this.priority = priority;
    }

    addNote(note) {
        this.note = note;
    }

    updatePriority(newPriority) {
        if (newPriority >= 1 && newPriority <= 5)
            this.priority = newPriority;
    }

    updateDueDate(newDate) {
        this.dueDate = newDate;
    }
}


const task1 = new Task("Hello world");
task1.addNote("This is a note that I am testing");
task1.checkList.add("my list number 1");
task1.checkList.add("my list number 2")

task1.checkList.update(1, "last list", true);
// task1.checkList.delete(1);
console.log(new Date(task1.dueDate).getFullYear());
task1.updateDueDate("2018-06-12T19:30")
console.log(new Date(task1.dueDate).getFullYear());
console.log(task1.checkList.list);