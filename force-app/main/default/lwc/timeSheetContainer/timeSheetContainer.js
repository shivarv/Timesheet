import { LightningElement,track } from 'lwc';

export default class TimeSheetContainer extends LightningElement {
    @track currentDate = new Date();
    @track weeks = [];
    daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    projectOptions = [
        { label: 'Project A', value: 'Project A' },
        { label: 'Project B', value: 'Project B' },
        { label: 'Project C', value: 'Project C' },
        { label: 'Project D', value: 'Project D' }
    ];

    connectedCallback() {
        this.loadWeeks();
    }

    loadWeeks() {
        let firstDayOfMonth = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
        let firstMonday = new Date(firstDayOfMonth);
        while (firstMonday.getDay() !== 1) {
            firstMonday.setDate(firstMonday.getDate() + 1);
        }

        let weeks = [];
        let weekNumber = 1;
        let currentWeekStart = new Date(firstMonday);
        let projects = this.projectOptions;

        while (currentWeekStart.getMonth() === this.currentDate.getMonth()) {
            let week = {
                weekNumber: weekNumber++,
                projects: projects.map((projectName, projectIndex) => ({
                    id: `${currentWeekStart.toISOString()}-${projectIndex}`, // Unique ID
                    name: projectName.label,
                    isFirstRow: projectIndex === 0, // Only the first project row should show the week number
                    days: this.daysOfWeek.map((day, i) => ({
                        date: new Date(currentWeekStart.getFullYear(), currentWeekStart.getMonth(), currentWeekStart.getDate() + i).toISOString().split('T')[0],
                        hoursWorked: ''
                    })),
                    isLastRow: projectIndex == this.projectOptions.length - 1, // Only the first project row should show the week number
                }))
            };
            weeks.push(week);
            currentWeekStart.setDate(currentWeekStart.getDate() + 7);
        }

        this.weeks = weeks;
    }

    handleHoursChange(event) {
        let date = event.target.dataset.id;
        let projectId = event.target.dataset.project;
        let value = event.target.value;

        this.weeks = this.weeks.map(week => ({
            ...week,
            projects: week.projects.map(project => 
                project.id === projectId
                    ? { ...project, days: project.days.map(day => day.date === date ? { ...day, hoursWorked: value } : day) }
                    : project
            )
        }));
    }

    handlePreviousMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.loadWeeks();
    }

    handleNextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.loadWeeks();
    }

    handleProjectChange(event) {

    }

    handleSaveTimesheet() {
        console.log('Saving timesheet data:', JSON.stringify(this.weeks, null, 2));
    }
}