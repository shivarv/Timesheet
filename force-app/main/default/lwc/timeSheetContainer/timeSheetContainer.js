import { LightningElement,track } from 'lwc';
import getInitDataApex from '@salesforce/apex/TimeSheetController.getInitData';

export default class TimeSheetContainer extends LightningElement {
    @track currentDate = new Date();
    @track weeks = [];
    monthName;
    year;
    daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    projectOptions = [
    ];

    connectedCallback() {
        getInitDataApex().then(result => {
            console.log(result);
            this.projectOptions  = [...this.getProjectList(result)];
            this.loadWeeks();
            this.monthName = this.currentDate.toLocaleString('default', { month: 'long' }); // "January", "February", etc.
            this.year = this.currentDate.getFullYear();
        }).catch(error => {
            console.log(error);
        });
    }

    getProjectList(result) {
        let options = [];
        for(let option of result.projectOptions) {
            options.push({label: option.label, value: option.value});
        }
        return options;
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
                    isLastRow: false, // Only the first project row should show the week number
                }))
            };
            week.projects.push( {
                id: 'lastRow'+'-'+projects.length,
                name: 'empty',
                isFirstRow: false,
                days: this.daysOfWeek.map((day, i) => ({
                    date: new Date(currentWeekStart.getFullYear(), currentWeekStart.getMonth(), currentWeekStart.getDate() + i).toISOString().split('T')[0],
                    hoursWorked: ''
                })),
                isLastRow: true, // 
            });
            weeks.push(week);
            currentWeekStart.setDate(currentWeekStart.getDate() + 7);
        }
        this.weeks = [... weeks];
    }

    handleHoursChange(event) {
        let date = event.target.dataset.id;
        let projectId = event.target.dataset.project;
        let value = event.target.value;
        let weekNumber = event.target.dataset.weekNumber;
        let weekRef = this.weeks.find(ele => ele.weekNumber == weekNumber);
        let projects = weekRef.projects;

        let totalHours = 0;
        projects.find(project => project.id == projectId).days.find(ele => ele.date == date).hoursWorked = value;
        
        for(let project of projects) {
            if(project.isLastRow != true ) {
                let day = project.days.find(ele => ele.date == date);
                totalHours += ( day.hoursWorked ?  Number(day.hoursWorked): 0) ;
            }
        }
        projects[projects.length - 1].days.find(ele => ele.date == date).hoursWorked = totalHours;
        // weekRef.projects[0].days.find(ele => ele.date == event.target.dataset.id

        debugger;
    }

    handlePreviousMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.monthName = this.currentDate.toLocaleString('default', { month: 'long' }); // "January", "February", etc.
        this.loadWeeks();
    }

    handleNextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.monthName = this.currentDate.toLocaleString('default', { month: 'long' }); // "January", "February", etc.
        this.loadWeeks();
    }

    handleProjectChange(event) {

    }

    handleSaveTimesheet() {
        console.log('Saving timesheet data:', JSON.stringify(this.weeks, null, 2));
    }
}