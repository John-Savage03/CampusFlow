/* grades.js - grade tracker and target-grade calculator */

import {
    getGrades,
    getCourses,
    getCourseById,
    getGradesForCourse,
    addGrade,
    deleteGrade,
    GRADE_CATEGORIES
}
from "./state.js";


import {
    createId,
    cleanText,
    calculatePointsAverage,
    getLetterGrade
}
from "./utils.js";


import {
    openModal,
    closeModal,
    showMessage
}
from "./ui.js";


function option(
    value,
    label
) {

    const item =
        document.createElement(
            "option"
        );


    item.value =
        value;


    item.textContent =
        label;


    return item;

}


function formatPercent(
    value
) {

    return (
        value === null ||
        !Number.isFinite(
            value
        )
    )
        ? "--"
        : `${value.toFixed(1)}%`;

}


/* ================================================= */
/* SELECTORS */
/* ================================================= */

function populateSelectors() {

    const courses =
        getCourses();


    const gradeCourse =
        document.getElementById(
            "gradeCourse"
        );


    const courseFilter =
        document.getElementById(
            "gradeCourseFilter"
        );


    const calculatorCourse =
        document.getElementById(
            "gradeCalculatorCourse"
        );


    const category =
        document.getElementById(
            "gradeCategory"
        );


    const categoryFilter =
        document.getElementById(
            "gradeCategoryFilter"
        );


    if (
        !gradeCourse ||
        !courseFilter ||
        !calculatorCourse ||
        !category ||
        !categoryFilter
    ) {

        return;

    }


    const previousCourseFilter =
        courseFilter.value;


    const previousCalculator =
        calculatorCourse.value;


    const previousCategoryFilter =
        categoryFilter.value;


    gradeCourse.replaceChildren();


    courseFilter.replaceChildren(
        option(
            "all",
            "All Courses"
        )
    );


    calculatorCourse.replaceChildren();


    courses.forEach(
        course => {

            const label =
                `${course.code} - ${course.name}`;


            gradeCourse.appendChild(
                option(
                    course.id,
                    label
                )
            );


            courseFilter.appendChild(
                option(
                    course.id,
                    label
                )
            );


            calculatorCourse.appendChild(
                option(
                    course.id,
                    label
                )
            );

        }
    );


    if (
        courses.some(
            course =>
                course.id ===
                previousCourseFilter
        )
    ) {

        courseFilter.value =
            previousCourseFilter;

    }


    if (
        courses.some(
            course =>
                course.id ===
                previousCalculator
        )
    ) {

        calculatorCourse.value =
            previousCalculator;

    }


    category.replaceChildren();


    categoryFilter.replaceChildren(
        option(
            "all",
            "All Categories"
        )
    );


    GRADE_CATEGORIES.forEach(
        item => {

            category.appendChild(
                option(
                    item,
                    item
                )
            );


            categoryFilter.appendChild(
                option(
                    item,
                    item
                )
            );

        }
    );


    if (
        GRADE_CATEGORIES.includes(
            previousCategoryFilter
        )
    ) {

        categoryFilter.value =
            previousCategoryFilter;

    }

}


/* ================================================= */
/* SUMMARY */
/* ================================================= */

function renderSummary() {

    const grades =
        getGrades();


    document.getElementById(
        "gradeItemCount"
    ).textContent =
        grades.length;


    document.getElementById(
        "gradeCourseCount"
    ).textContent =
        new Set(
            grades.map(
                grade =>
                    grade.courseId
            )
        ).size;


    const averages =
        getCourses()
            .map(
                course =>
                    calculatePointsAverage(
                        getGradesForCourse(
                            course.id
                        )
                    )
            )
            .filter(
                value =>
                    value !== null
            );


    document.getElementById(
        "gradeHighestAverage"
    ).textContent =
        averages.length
            ? formatPercent(
                Math.max(
                    ...averages
                )
            )
            : "--";


    document.getElementById(
        "gradeOverallAverage"
    ).textContent =
        formatPercent(
            calculatePointsAverage(
                grades
            )
        );

}


/* ================================================= */
/* COURSE AVERAGES */
/* ================================================= */

function renderCourseSummary() {

    const container =
        document.getElementById(
            "gradeCourseSummary"
        );


    if (!container) {

        return;

    }


    container.replaceChildren();


    const courses =
        getCourses();


    if (
        !courses.length
    ) {

        const p =
            document.createElement(
                "p"
            );


        p.className =
            "empty-message";


        p.textContent =
            "Create a course before tracking grades.";


        container.appendChild(
            p
        );


        return;

    }


    courses.forEach(
        course => {

            const grades =
                getGradesForCourse(
                    course.id
                );


            const average =
                calculatePointsAverage(
                    grades
                );


            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "grade-course-card";


            const left =
                document.createElement(
                    "div"
                );


            const title =
                document.createElement(
                    "strong"
                );


            title.textContent =
                `${course.code} - ${course.name}`;


            const count =
                document.createElement(
                    "p"
                );


            count.textContent =
                `${grades.length} graded item${
                    grades.length === 1
                        ? ""
                        : "s"
                }`;


            left.append(
                title,
                count
            );


            const right =
                document.createElement(
                    "div"
                );


            right.className =
                "grade-average";


            const percent =
                document.createElement(
                    "strong"
                );


            percent.textContent =
                formatPercent(
                    average
                );


            const letter =
                document.createElement(
                    "span"
                );


            letter.textContent =
                average === null
                    ? "No grades"
                    : `Letter Grade: ${getLetterGrade(average)}`;


            right.append(
                percent,
                letter
            );


            card.append(
                left,
                right
            );


            container.appendChild(
                card
            );

        }
    );

}


/* ================================================= */
/* GRADE TABLE */
/* ================================================= */

function cell(
    text
) {

    const td =
        document.createElement(
            "td"
        );


    td.textContent =
        text;


    return td;

}


function renderTable() {

    const body =
        document.getElementById(
            "gradeTableBody"
        );


    if (!body) {

        return;

    }


    body.replaceChildren();


    const courseFilter =
        document.getElementById(
            "gradeCourseFilter"
        )?.value || "all";


    const categoryFilter =
        document.getElementById(
            "gradeCategoryFilter"
        )?.value || "all";


    let grades =
        getGrades();


    if (
        courseFilter !== "all"
    ) {

        grades =
            grades.filter(
                grade =>
                    grade.courseId ===
                    courseFilter
            );

    }


    if (
        categoryFilter !== "all"
    ) {

        grades =
            grades.filter(
                grade =>
                    grade.category ===
                    categoryFilter
            );

    }


    if (
        !grades.length
    ) {

        const row =
            document.createElement(
                "tr"
            );


        const td =
            cell(
                "No grades match the current filters."
            );


        td.colSpan =
            7;


        row.appendChild(
            td
        );


        body.appendChild(
            row
        );


        return;

    }


    grades.forEach(
        grade => {

            const course =
                getCourseById(
                    grade.courseId
                );


            const percentage =
                (
                    grade.pointsEarned /
                    grade.pointsPossible
                ) * 100;


            const row =
                document.createElement(
                    "tr"
                );


            row.append(

                cell(
                    course
                        ? course.code
                        : "Unknown"
                ),

                cell(
                    grade.title
                ),

                cell(
                    grade.category
                ),

                cell(
                    `${grade.pointsEarned} / ${grade.pointsPossible}`
                ),

                cell(
                    formatPercent(
                        percentage
                    )
                ),

                cell(
                    getLetterGrade(
                        percentage
                    )
                )

            );


            const action =
                document.createElement(
                    "td"
                );


            const remove =
                document.createElement(
                    "button"
                );


            remove.type =
                "button";


            remove.className =
                "delete-button";


            remove.textContent =
                "Delete";


            remove.addEventListener(
                "click",
                () => {

                    if (
                        deleteGrade(
                            grade.id
                        )
                    ) {

                        renderGrades();


                        showMessage(
                            "Grade deleted."
                        );

                    }

                }
            );


            action.appendChild(
                remove
            );


            row.appendChild(
                action
            );


            body.appendChild(
                row
            );

        }
    );

}


/* ================================================= */
/* CALCULATOR */
/* ================================================= */

function updateCalculatorAverage() {

    const select =
        document.getElementById(
            "gradeCalculatorCourse"
        );


    const output =
        document.getElementById(
            "calculatorCurrentAverage"
        );


    if (
        !select ||
        !output
    ) {

        return;

    }


    output.textContent =
        select.value
            ? formatPercent(
                calculatePointsAverage(
                    getGradesForCourse(
                        select.value
                    )
                )
            )
            : "--";

}


function calculateNeededScore() {

    const courseId =
        document.getElementById(
            "gradeCalculatorCourse"
        )?.value;


    const targetRaw =
        document.getElementById(
            "targetGrade"
        )?.value ?? "";


    const weightRaw =
        document.getElementById(
            "remainingWeight"
        )?.value ?? "";


    const result =
        document.getElementById(
            "gradeCalculatorResult"
        );


    if (!result) {

        return;

    }


    if (!courseId) {

        result.textContent =
            "Select a course first.";


        return;

    }


    if (
        targetRaw === "" ||
        weightRaw === ""
    ) {

        result.textContent =
            "Enter both a target grade and remaining weight.";


        return;

    }


    const target =
        Number(
            targetRaw
        );


    const weight =
        Number(
            weightRaw
        );


    if (
        !Number.isFinite(
            target
        ) ||
        target < 0 ||
        target > 100
    ) {

        result.textContent =
            "Target grade must be between 0 and 100.";


        return;

    }


    if (
        !Number.isFinite(
            weight
        ) ||
        weight <= 0 ||
        weight > 100
    ) {

        result.textContent =
            "Remaining weight must be between 1 and 100.";


        return;

    }


    const current =
        calculatePointsAverage(
            getGradesForCourse(
                courseId
            )
        );


    if (
        current === null
    ) {

        result.textContent =
            "Add at least one grade for this course first.";


        return;

    }


    const remaining =
        weight / 100;


    const completed =
        1 - remaining;


    const needed =
        (
            target -
            current *
            completed
        ) /
        remaining;


    const course =
        getCourseById(
            courseId
        );


    const label =
        course
            ? course.code
            : "this course";


    if (
        needed <= 0
    ) {

        result.textContent =
            `Your current ${label} average is already high enough to meet a ${target.toFixed(1)}% target with the entered remaining weight.`;

    }

    else if (
        needed > 100
    ) {

        result.textContent =
            `You would need approximately ${needed.toFixed(1)}% on the remaining assessment. That would normally require extra credit or another grade improvement.`;

    }

    else {

        result.textContent =
            `You need approximately ${needed.toFixed(1)}% on the remaining assessment to finish ${label} with a ${target.toFixed(1)}%.`;

    }

}


/* ================================================= */
/* PUBLIC RENDER */
/* ================================================= */

export function renderGrades() {

    populateSelectors();

    renderSummary();

    renderCourseSummary();

    renderTable();

    updateCalculatorAverage();

}


/* ================================================= */
/* SETUP */
/* ================================================= */

export function setupGrades(
    refreshApplication
) {

    document
        .getElementById(
            "openGradeModalButton"
        )
        ?.addEventListener(
            "click",
            () => {

                populateSelectors();


                if (
                    !getCourses().length
                ) {

                    return showMessage(
                        "Create a course before adding grades.",
                        "warning"
                    );

                }


                openModal(
                    "gradeModal"
                );

            }
        );


    document
        .getElementById(
            "gradeCourseFilter"
        )
        ?.addEventListener(
            "change",
            renderTable
        );


    document
        .getElementById(
            "gradeCategoryFilter"
        )
        ?.addEventListener(
            "change",
            renderTable
        );


    document
        .getElementById(
            "gradeCalculatorCourse"
        )
        ?.addEventListener(
            "change",
            updateCalculatorAverage
        );


    document
        .getElementById(
            "calculateGradeButton"
        )
        ?.addEventListener(
            "click",
            calculateNeededScore
        );


    document
        .getElementById(
            "gradeForm"
        )
        ?.addEventListener(
            "submit",
            event => {

                event.preventDefault();


                const courseId =
                    document.getElementById(
                        "gradeCourse"
                    )?.value;


                const title =
                    cleanText(
                        document.getElementById(
                            "gradeTitle"
                        )?.value,
                        80
                    );


                const category =
                    document.getElementById(
                        "gradeCategory"
                    )?.value;


                const earnedRaw =
                    document.getElementById(
                        "pointsEarned"
                    )?.value ?? "";


                const possibleRaw =
                    document.getElementById(
                        "pointsPossible"
                    )?.value ?? "";


                const pointsEarned =
                    Number(
                        earnedRaw
                    );


                const pointsPossible =
                    Number(
                        possibleRaw
                    );


                if (
                    !getCourseById(
                        courseId
                    )
                ) {

                    return showMessage(
                        "Choose a valid course.",
                        "error"
                    );

                }


                if (!title) {

                    return showMessage(
                        "Grade title is required.",
                        "error"
                    );

                }


                if (
                    !GRADE_CATEGORIES.includes(
                        category
                    )
                ) {

                    return showMessage(
                        "Choose a valid grade category.",
                        "error"
                    );

                }


                if (
                    earnedRaw === "" ||
                    !Number.isFinite(
                        pointsEarned
                    ) ||
                    pointsEarned < 0
                ) {

                    return showMessage(
                        "Enter valid points earned.",
                        "error"
                    );

                }


                if (
                    possibleRaw === "" ||
                    !Number.isFinite(
                        pointsPossible
                    ) ||
                    pointsPossible <= 0
                ) {

                    return showMessage(
                        "Points possible must be greater than zero.",
                        "error"
                    );

                }


                addGrade({

                    id:
                        createId(
                            "grade"
                        ),

                    courseId,

                    title,

                    category,

                    pointsEarned,

                    pointsPossible

                });


                document
                    .getElementById(
                        "gradeForm"
                    )
                    .reset();


                closeModal(
                    "gradeModal"
                );


                refreshApplication();


                showMessage(
                    "Grade added."
                );

            }
        );

}