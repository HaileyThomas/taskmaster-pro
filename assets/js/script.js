var tasks = {};


// create a task function
var createTask = function (taskText, taskDate, taskList) {
  // create elements that make up a task item
  var taskLi = $("<li>").addClass("list-group-item");
  var taskSpan = $("<span>")
    .addClass("badge badge-primary badge-pill")
    .text(taskDate);
  var taskP = $("<p>")
    .addClass("m-1")
    .text(taskText);

  // append span and p element to parent li
  taskLi.append(taskSpan, taskP);

  // check due date
  auditTask(taskLi);

  // append to ul list on the page
  $("#list-" + taskList).append(taskLi);
};

// load tasks function
var loadTasks = function () {
  tasks = JSON.parse(localStorage.getItem("tasks"));

  // if nothing in localStorage, create a new object to track all task status arrays
  if (!tasks) {
    tasks = {
      toDo: [],
      inProgress: [],
      inReview: [],
      done: []
    };
  }

  // loop over object properties
  $.each(tasks, function (list, arr) {
    // then loop over sub-array
    arr.forEach(function (task) {
      createTask(task.text, task.date, list);
    });
  });
};

// save task function
var saveTasks = function () {
  localStorage.setItem("tasks", JSON.stringify(tasks));
};

// function for soon to come and past due tasks
var auditTask = function (taskEl) {
  // get date from task element
  var date = $(taskEl).find("span").text().trim();
  // convert to moment object at 5:00pm
  var time = moment(date, "L").set("hour", 17);
  // remove any old classes from element
  $(taskEl).removeClass("list-group-item-warning list-group-item-danger");
  // apply new class if task is near/over due date
  if (moment().isAfter(time)) {
    $(taskEl).addClass("list-group-item-danger");
  }
  else if (Math.abs(moment().diff(time, "days")) <= 2) {
    $(taskEl).addClass("list-group-item-warning");
  }
};

// make list items sortable
$(".card .list-group").sortable({
  // enable dragging across lists
  connectWith: $(".card .list-group"),
  scroll: false,
  tolerance: "pointer",
  helper: "clone",
  activate: function (event, ui) {
    $(this).addClass("dropover");
    $(".bottom-trash").addClass("bottom-trash-drag");
  },
  deactivate: function (event, ui) {
    $(this).removeClass("dropover");
    $(".bottom-trash").removeClass("bottom-trash-drag");
  },
  over: function (event) {
    $(event.target).addClass("dropover-activate");
  },
  out: function (event) {
    $(event.target).removeClass("dropover-active");
  },
  update: function () {
    // array to store the task data in
    var tempArr = [];
    // loop over current set of children in sortable list
    $(this).children().each(function () {
      // save values in temp array
      tempArr.push({
        text: $(this)
          .find("p")
          .text()
          .trim(),
        date: $(this)
          .find("span")
          .text()
          .trim()
      });
    });
    // trim down the list's ID to match object property
    var arrName = $(this)
      .attr("id")
      .replace("list-", "");
    // update array on tasks object and save
    tasks[arrName] = tempArr;
    saveTasks();
  }
});

// make trash droppable
$("#trash").droppable({
  accept: ".card .list-group-item",
  tolerance: "touch",
  drop: function (event, ui) {
    // remove dragged element from the dom
    ui.draggable.remove();
    $(".bottom-trash").removeClass("bottom-trash-active");
  },
  over: function (event, ui) {
    $(".bottom-trash").addClass("bottom-trash-active");
  },
  out: function (event, ui) {
    $(".bottom-trash").removeClass("bottom-trash-active");
  }
});

// date picker
$("#modalDueDate").datepicker({
  minDate: 1
});

// modal was triggered
$("#task-form-modal").on("show.bs.modal", function () {
  // clear values
  $("#modalTaskDescription, #modalDueDate").val("");
});

// modal is fully visible
$("#task-form-modal").on("shown.bs.modal", function () {
  // highlight textarea
  $("#modalTaskDescription").trigger("focus");
});

// save button in modal was clicked
$("#task-form-modal .btn-save").click(function () {
  // get form values
  var taskText = $("#modalTaskDescription").val();
  var taskDate = $("#modalDueDate").val();

  if (taskText && taskDate) {
    createTask(taskText, taskDate, "toDo");

    // close modal
    $("#task-form-modal").modal("hide");

    // save in tasks array
    tasks.toDo.push({
      text: taskText,
      date: taskDate
    });

    saveTasks();
  }
});

// task text was clicked
$(".list-group").on("click", "p", function () {
  var text = $(this)
    .text()
    .trim();
  // replace p element with a new textrea
  var textInput = $("<textarea>")
    .addClass("form-control")
    .val(text)
  $(this).replaceWith(textInput);
  // auto focus new element
  textInput.trigger("focus");
});

// editable field was un-focused
$(".list-group").on("blur", "textarea", function () {
  // get the textarea's current value/text
  var text = $(this)
    .val();
  // get the parent ul's id attribute
  var status = $(this)
    .closest(".list-group")
    .attr("id")
    .replace("list-", "");
  // get the tasks's position in the list of other li elements
  var index = $(this)
    .closest(".list-group-item")
    .index();
  // update task in array and re-save to local storage
  tasks[status][index].text = text;
  saveTasks();
  // replace p element
  var taskP = $("<p>")
    .addClass("m-1")
    .text(text);
  // replace textarea with p element
  $(this).replaceWith(taskP);
});

// due date was clicked
$(".list-group").on("click", "span", function () {
  // get current text
  var date = $(this)
    .text()
    .trim();
  // create new input element
  var dateInput = $("<input>")
    .attr("type", "text")
    .addClass("form-control")
    .val(date);
  // swap out elements
  $(this).replaceWith(dateInput);
  // enable jquery ui datepicker
  dateInput.datepicker({
    minDate: 1,
    onClose: function () {
      // when calender is closed, forced a "change" event on the dateInput
      $(this).trigger("change");
    }
  });
  // automatically focus on new element
  dateInput.trigger("focus");
});

//value of due date was changed
$(".list-group").on("change", "input[type='text']", function () {
  // get current text
  var date = $(this)
    .val();
  // get the parent ul's id attribute
  var status = $(this)
    .closest(".list-group")
    .attr("id")
    .replace("list-", "");
  // get the task's position in the list of other li elements
  var index = $(this)
    .closest(".list-group-item")
    .index();
  // update task in array and re-save to local storage
  tasks[status][index].date = date;
  saveTasks();
  // recreate span element with bootstrap classes
  var taskSpan = $("<span>")
    .addClass("badge badge-primary badge-pill")
    .text(date);
  // replace input with span element
  $(this).replaceWith(taskSpan);
  // pass task's <li> element into auditTask() to check new due date
  auditTask($(taskSpan).closest(".list-group-item"));
});

// remove all tasks
$("#remove-tasks").on("click", function () {
  for (var key in tasks) {
    tasks[key].length = 0;
    $("#list-" + key).empty();
  }
  saveTasks();
});

// load tasks for the first time
loadTasks();

// set interval to check for due dates every 30 mins
setInterval(function () {
  $(".card .list-group-item").each(function () {
    auditTask($(this));
  });
}, 1800000);
