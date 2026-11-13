/*
    courses.js

    Handles:

    - displaying courses
    - adding courses
    - viewing course details
    - deleting courses
*/


import {
    getCourses,
    getCourseById,
    getTasksForCourse,
    addCourse,
    updateCourse,
    deleteCourse
}
from "./state.js";


import {
    createId,
    formatTime
}
from "./utils.js";


import {
    openDetails
}
from "./details.js";


import {
    showMessage
}
from "./feedback.js";



/* ================================================= */
/* REFRESH CALLBACK */
/* ================================================= */

let refreshApplicationCallback =
    null;

let editingCourseId = null; //tracks courses edited


/* ================================================= */
/* CLEAN TEXT */
/* ================================================= */

function cleanText(
    value,
    maxLength
) {

    return String(
        value || ""
    )
        .trim()
        .replace(
            /\s+/g,
            " "
        )
        .slice(
            0,
            maxLength
        );

}



/* ================================================= */
/* COURSE DETAILS */
/* ================================================= */

function openCourseDetails(
    course
) {

    const tasks =
        getTasksForCourse(
            course.id
        );


    const assignmentCount =
        tasks.filter(
            task =>
                task.type ===
                "assignment"
        ).length;


    const examCount =
        tasks.filter(
            task =>
                task.type ===
                "exam"
        ).length;


    openDetails({

        id:
            course.id,

        source:
            "course",

        type:
            "course",

        topic:
            `${course.code} - ${course.name}`,

        title:
            `${course.code} - ${course.name}`,

        instructor:
            course.instructor,

        schedule:
            course.days === "Online"
                ? "Online"
                : `${course.days} • ${formatTime(course.time)}`,

        description:
            `Instructor: ${course.instructor}\n\nAssignments: ${assignmentCount}\nExams: ${examCount}`

    });

}



/* ================================================= */
/* DELETE COURSE */
/* ================================================= */

function removeCourse(
    course
) {

    const coursework =
        getTasksForCourse(
            course.id
        );


    /*
        Do not allow a course to be deleted while
        assignments or exams are still attached.

        Otherwise those tasks would point to a
        course that no longer exists.
    */

    if (
        coursework.length > 0
    ) {

        showMessage(
            `This course still has ${coursework.length} assignment/exam item(s). Remove those first before deleting the course.`,
            "warning"
        );


        return;

    }


    const confirmed =
        window.confirm(
            `Are you sure you want to delete ${course.code} - ${course.name}?`
        );


    if (!confirmed) {

        return;

    }


    const success =
        deleteCourse(
            course.id
        );


    if (!success) {

        showMessage(
            "Unable to delete the course.",
            "error"
        );


        return;

    }


    /*
        Refresh every area of CampusFlow so the
        Dashboard, Assignments, Materials, etc.
        immediately know the course is gone.
    */

    if (
        typeof refreshApplicationCallback ===
        "function"
    ) {

        refreshApplicationCallback();

    }

    else {

        renderCourses();

    }


    showMessage(
        `${course.code} deleted.`,
        "success"
    );

}



/* ================================================= */
/* EMPTY COURSE MESSAGE */
/* ================================================= */

function createEmptyMessage() {

    const message =
        document.createElement(
            "div"
        );


    message.className =
        "empty-message";


    message.textContent =
        "No courses have been added yet.";


    return message;

}



/* ================================================= */
/* RENDER COURSES */
/* ================================================= */

export function renderCourses() {

    const grid =
        document.getElementById(
            "courseGrid"
        );


    if (!grid) {

        return;

    }


    grid.replaceChildren();

    //display vertically semester folders
    grid.style.display = "block";

    //store semester folders
    const semesterFolders = new Map();

    //checks if the user wants to view archived courses
    const showArchived =
        document.getElementById("showArchivedCourses").checked;

    //display active courses or archived courses
    const courses = getCourses(true).filter(course =>
        Boolean(course.archived) === showArchived
    );



    /* ================================================= */
    /* NO COURSES */
    /* ================================================= */

    if (
        courses.length === 0
    ) {

       //display message if there are no courses to show
        const message = createEmptyMessage();

        if (showArchived) {
            message.textContent = "No archived courses.";
        }

        grid.appendChild(message);


        return;

    }



    /* ================================================= */
    /* COURSE CARDS */
    /* ================================================= */

    courses.forEach(
        course => {

            const tasks =
                getTasksForCourse(
                    course.id
                );


            const assignmentCount =
                tasks.filter(
                    task =>
                        task.type ===
                        "assignment"
                ).length;


            const examCount =
                tasks.filter(
                    task =>
                        task.type ===
                        "exam"
                ).length;



            /* ---------------- CARD ---------------- */

            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "course-card";

                // Display the selected color on the course card
                card.style.borderLeft =
                    "6px solid " + (course.color || "#2d6aec");


            /* ---------------- HEADER ---------------- */

            const header =
                document.createElement(
                    "div"
                );


            header.className =
                "course-card-header";



            const titleArea =
                document.createElement(
                    "div"
                );


            const code =
                document.createElement(
                    "span"
                );


            code.className =
                "course-code";


            code.textContent =
                course.code;



            const name =
                document.createElement(
                    "h3"
                );


            name.textContent =
                course.name;


            titleArea.append(
                code,
                name
            );


            header.appendChild(
                titleArea
            );



            /* ---------------- DETAILS ---------------- */

            const details =
                document.createElement(
                    "div"
                );


            details.className =
                "course-card-details";



            const instructor =
                document.createElement(
                    "p"
                );


            instructor.textContent =
                `Instructor: ${course.instructor}`;



            const schedule =
                document.createElement(
                    "p"
                );


            schedule.textContent =
                course.days === "Online"
                    ? "Schedule: Online"
                    : `Schedule: ${course.days} • ${formatTime(course.time)}`;



            const coursework =
                document.createElement(
                    "p"
                );


            coursework.textContent =
                `${assignmentCount} assignment${
                    assignmentCount === 1
                        ? ""
                        : "s"
                } • ${examCount} exam${
                    examCount === 1
                        ? ""
                        : "s"
                }`;


            details.append(
                instructor,
                schedule,
                coursework
            );



            /* ================================================= */
            /* BUTTON AREA */
            /* ================================================= */

            const actions =
                document.createElement(
                    "div"
                );


            actions.className =
                "course-card-actions";


            /*
                Inline layout is used so you do not
                have to change existing CSS just to
                make the feature work.
            */

            actions.style.display =
                "flex";


            actions.style.alignItems =
                "center";


            actions.style.gap =
                "10px";


            actions.style.flexWrap =
                "wrap";


            actions.style.marginTop =
                "16px";



            /* ---------------- VIEW BUTTON ---------------- */

            const viewButton =
                document.createElement(
                    "button"
                );


            viewButton.type =
                "button";


            viewButton.className =
                "secondary-button";


            viewButton.textContent =
                "View Course";


            viewButton.addEventListener(
                "click",
                event => {

                    event.stopPropagation();


                    openCourseDetails(
                        course
                    );

                }
            );



            /* ---------------- DELETE BUTTON ---------------- */

            const deleteButton =
                document.createElement(
                    "button"
                );


            deleteButton.type =
                "button";


            deleteButton.className =
                "course-delete-button";


            deleteButton.textContent =
                "Delete Course";


            /*
                Style here so the button works even
                before adding anything to main.css.
            */

            deleteButton.style.padding =
                "8px 14px";


            deleteButton.style.border =
                "1px solid #dc2626";


            deleteButton.style.borderRadius =
                "6px";


            deleteButton.style.background =
                "transparent";


            deleteButton.style.color =
                "#dc2626";


            deleteButton.style.fontWeight =
                "600";


            deleteButton.style.cursor =
                "pointer";


            deleteButton.addEventListener(
                "mouseenter",
                () => {

                    deleteButton.style.background =
                        "#dc2626";


                    deleteButton.style.color =
                        "white";

                }
            );


            deleteButton.addEventListener(
                "mouseleave",
                () => {

                    deleteButton.style.background =
                        "transparent";


                    deleteButton.style.color =
                        "#dc2626";

                }
            );


            deleteButton.addEventListener(
                "click",
                event => {

                    event.stopPropagation();


                    removeCourse(
                        course
                    );

                }
            );


            //create edit course button
            const editButton = document.createElement("button");
            editButton.type = "button";
            editButton.className = "secondary-button";
            editButton.textContent = "Edit";

            //opens course for editing
            editButton.addEventListener("click", event => {
                event.stopPropagation();
                editCourse(course);
            });

            // Create a button to archive or restore the course
const archiveButton = document.createElement("button");
archiveButton.type = "button";
archiveButton.className = "secondary-button";

// Change the button text based on the course status
archiveButton.textContent =
    course.archived ? "Restore" : "Archive";

// Archive or restore the selected course
archiveButton.addEventListener("click", event => {
    event.stopPropagation();

    const saved = updateCourse(course.id, {
        archived: !course.archived
    });

    // Check if the change was saved
    if (!saved) {
        return showMessage("Unable to save course.", "error");
    }

    // Refresh the application after the change
    refreshApplicationCallback();

        //display a confirmation message
        showMessage(
            course.archived ? "Course restored." : "Course archived.",
            "success"
        );
    });

    //add all buttons to the course card
    actions.append(
        viewButton,
        editButton,
        archiveButton,
        deleteButton
    );



            /* ================================================= */
            /* BUILD CARD */
            /* ================================================= */

            card.append(
                header,
                details,
                actions
            );



            /*
                Clicking somewhere else on the card
                opens the course details.
            */

            card.addEventListener(
                "click",
                () => {

                    openCourseDetails(
                        course
                    );

                }
            );


            //get semester for current course
            const semester = course.semester || "Unassigned";
            const semesterKey = semester.toLowerCase();

            //create semester folder if one doesn't exist
            if (!semesterFolders.has(semesterKey)) {

                //expandable folder
                const folder = document.createElement("details");
                folder.open = true;
                folder.style.marginBottom = "20px";

                //folder heading
                const heading = document.createElement("summary");
                heading.textContent = semester;
                heading.style.fontWeight = "bold";
                heading.style.fontSize = "18px";
                heading.style.cursor = "pointer";
                heading.style.padding = "12px";

                //grid to hold courses
                const folderGrid = document.createElement("div");
                folderGrid.className = "course-grid";

                //add heading and course grid to folder
                folder.append(heading, folderGrid);
                grid.appendChild(folder);

                //save the folder
                semesterFolders.set(semesterKey, folderGrid);
            }

            //add course to semester folder
            semesterFolders.get(semesterKey).appendChild(card);

        }
    );

}



/* ================================================= */
/* OPEN COURSE MODAL */
/* ================================================= */

//opens course in existing info
function editCourse(course) {
    editingCourseId = course.id;

    //Fill form with current details
    document.getElementById("courseCode").value = course.code;
    document.getElementById("courseName").value = course.name;
    document.getElementById("courseInstructor").value = course.instructor;
    document.getElementById("courseDays").value = course.days;
    document.getElementById("courseTime").value = course.time;
    document.getElementById("courseColor").value = course.color || "#2d6aec";
    
    //load semester assigned to course
    document.getElementById("courseSemester").value =
        course.semester || "";

    //editing mode
    document.getElementById("courseModalTitle").textContent = "Edit Course";
    document.getElementById("courseSubmitButton").textContent = "Save Changes";

    //display the course form
    openCourseModal();
}

function openCourseModal() {

    const modal =
        document.getElementById(
            "courseModal"
        );


    if (!modal) {

        return;

    }


    modal.classList.add(
        "show"
    );


    modal.setAttribute(
        "aria-hidden",
        "false"
    );


    document.getElementById(
        "courseCode"
    )?.focus();

}



/* ================================================= */
/* CLOSE COURSE MODAL */
/* ================================================= */

function closeCourseModal() {

    const modal =
        document.getElementById(
            "courseModal"
        );


    if (!modal) {

        return;

    }


    modal.classList.remove(
        "show"
    );


    modal.setAttribute(
        "aria-hidden",
        "true"
    );


    document.getElementById(
        "courseForm"
    )?.reset();

}



/* ================================================= */
/* SETUP COURSE SYSTEM */
/* ================================================= */

export function setupCourses(
    refreshApplication
) {

    /*
        Save app.js refreshApplication so course
        deletion and creation can refresh everything.
    */

    refreshApplicationCallback =
        refreshApplication;

    //refresh course list when switching archive views
    document.getElementById("showArchivedCourses")
        ?.addEventListener("change", renderCourses);


    const modal =
        document.getElementById(
            "courseModal"
        );


    const form =
        document.getElementById(
            "courseForm"
        );



    /* ================================================= */
    /* OPEN MODAL */
    /* ================================================= */

    //open a blank form
    document.getElementById("openCourseModalButton")
        ?.addEventListener("click", () => {
            //clear the selected course
            editingCourseId = null;

            //reset form
            document.getElementById("courseForm").reset();
            document.getElementById("courseModalTitle").textContent = "Add Course";
            document.getElementById("courseSubmitButton").textContent = "Add Course";

            openCourseModal();
        });



    /* ================================================= */
    /* CLOSE MODAL BUTTON */
    /* ================================================= */

    document.getElementById(
        "closeCourseModalButton"
    )?.addEventListener(
        "click",
        closeCourseModal
    );



    /* ================================================= */
    /* CANCEL BUTTON */
    /* ================================================= */

    document.getElementById(
        "cancelCourseButton"
    )?.addEventListener(
        "click",
        closeCourseModal
    );



    /* ================================================= */
    /* ADD COURSE */
    /* ================================================= */

    form?.addEventListener(
        "submit",
        event => {

            event.preventDefault();



            const code =
                cleanText(
                    document.getElementById(
                        "courseCode"
                    )?.value,
                    20
                ).toUpperCase();


            const name =
                cleanText(
                    document.getElementById(
                        "courseName"
                    )?.value,
                    80
                );


            const instructor =
                cleanText(
                    document.getElementById(
                        "courseInstructor"
                    )?.value,
                    80
                );


            const days =
                document.getElementById(
                    "courseDays"
                )?.value || "";


            const time =
                document.getElementById(
                    "courseTime"
                )?.value || "";



            /* ---------------- VALIDATION ---------------- */

            if (!code) {

                showMessage(
                    "Course code is required.",
                    "error"
                );


                return;

            }


            if (!name) {

                showMessage(
                    "Course name is required.",
                    "error"
                );


                return;

            }


            if (!instructor) {

                showMessage(
                    "Instructor is required.",
                    "error"
                );


                return;

            }


            if (!days) {

                showMessage(
                    "Choose a meeting schedule.",
                    "error"
                );


                return;

            }


            if (
                days !== "Online" &&
                !time
            ) {

                showMessage(
                    "Choose a meeting time.",
                    "error"
                );


                return;

            }



            /* ================================================= */
            /* PREVENT DUPLICATE COURSE CODE */
            /* ================================================= */

            //get semester entered by the user
            const semester = cleanText(
                document.getElementById("courseSemester").value,
                30
            ) || "Unassigned";

            //checks for duplicate course codes
            const duplicate = getCourses(true).some(course =>
                course.id !== editingCourseId &&
                course.code.toLowerCase() === code.toLowerCase() &&
                (course.semester || "Unassigned").toLowerCase() === semester.toLowerCase()
            );


            if (duplicate) {

                showMessage(
                    `${code} is already in your course list.`,
                    "warning"
                );


                return;

            }



            /* ================================================= */
            /* CREATE COURSE */
            /* ================================================= */

            //store course info 
            const newCourse = {
                id: editingCourseId || createId("course"),
                code,
                name,
                instructor,
                days,
                time: time || "00:00",
                color: document.getElementById("courseColor").value,
                semester

            };

            //update existing course or create a new one
            const saved = editingCourseId
                ? updateCourse(editingCourseId, newCourse)
                : addCourse(newCourse);

            
            closeCourseModal();



            if (
                typeof refreshApplicationCallback ===
                "function"
            ) {

                refreshApplicationCallback();

            }

            else {

                renderCourses();

            }

            //display message based on what user does
            showMessage(
                saved
                    ? (editingCourseId ? "course updated." : "Course added.")
                    : "Course saved in memory, but browser storage was unavailable.",
                saved
                    ? "success"
                    : "warning"
            );

            editingCourseId = null; //clear editing mode after save
        }
    );



    /* ================================================= */
    /* CLOSE MODAL BY CLICKING BACKDROP */
    /* ================================================= */

    modal?.addEventListener(
        "click",
        event => {

            if (
                event.target === modal
            ) {

                closeCourseModal();

            }

        }
    );

}