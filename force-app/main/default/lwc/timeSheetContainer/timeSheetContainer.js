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
        let inputDateString = this.currentDate.getFullYear() + '-' +
                    String(this.currentDate.getMonth() + 1).padStart(2, '0') + '-' +
                    String(this.currentDate.getDate()).padStart(2, '0');
        getInitDataApex({inputDateString: inputDateString}).then(result => {
            console.log(result);
            try{
            this.setupData(result);            
            // Call Apex method with the formatted date
            
            //this.loadWeeks();
            this.monthName = this.currentDate.toLocaleString('default', { month: 'long' }); // "January", "February", etc.
            this.year = this.currentDate.getFullYear();
            } catch(e) {
                debugger;
            }
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

    getWeekOfDays(result, weekNumber, projectId) {
        let data = result.projectDaysWrapper[projectId];
        if (!data) {
            return []; // Return empty array if projectId is not found
        }
        let startIndex = (weekNumber - 1) * 7;
        let endIndex = Math.min(startIndex + 7, data.length); // Ensure we don't exceed list size
    
        return data.slice(startIndex, endIndex).map((item, index) => ({
            date: item.dayRecordDate, // Example date generation
            hoursWorked: item.hours,
            isDisabled: item.isDisabled
        }));
    }

    getTotalHoursRow(result, weekNumber, projectId) {
        let output = [];
        let startIndex = 0;
        let endIndex = 7; // Ensure we don't exceed list size
        for(let i = startIndex; i  < endIndex; i++){
            output.push(
                {
                    date: 'tot' +result.projectDaysWrapper[projectId][i].dayRecordDate,
                    hoursWorked: 0,
                    isDisabled: false
                }
            );
        }
        return output;
    }

    getWeeksCountInMonth(year, month) {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const firstDayOfWeek = firstDay.getDay(); 
        const lastDate = lastDay.getDate(); 
        return Math.ceil((firstDayOfWeek + lastDate) / 7);
    }

    setupData(result) {
        debugger;
        let firstDayOfMonth = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
        this.projectOptions  = [...this.getProjectList(result)];
        let weeks = [];
        let projects = this.projectOptions;
        let weeksInThisMonth = this.getWeeksCountInMonth(this.currentDate.getFullYear(), this.currentDate.getMonth());
        // projectDaysWrapper:  a02C1000003bv7HIAQ :  Array(28) {dayRecordDate: '2025-02-01', hours: 0, isDisabled: true}
        for(let i = 0; i < weeksInThisMonth; i++) {
            let week = {
                weekNumber: i + 1,
                projects: projects.map((project, projectIndex) => ({
                    id: `${project.value} week ${i + 1}`, // Unique ID,
                    projectId: project.value,
                    name: project.label,
                    isFirstRow: projectIndex === 0, // Only the first project row should show the week number
                    days: this.getWeekOfDays(result, i + 1, project.value),
                    isLastRow: false, // Only the first project row should show the week number
                }))
            };
            week.projects.push( {
                id: 'lastRow'+'-week-'+ (i + 1)+ '-'+ projects.length,
                projectId: 'totalProjectId',
                name: 'empty',
                isFirstRow: false,
                days: this.getTotalHoursRow(result, i + 1, projects[0].value),
                isLastRow: true // 
            });
            weeks.push(week);
        }
        this.weeks = [... weeks];

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
        projects.find(project => project.projectId
            == projectId).days.find(ele => ele.date == date).hoursWorked = value;
        
        for(let project of projects) {
            if(project.isLastRow != true ) {
                let day = project.days.find(ele => ele.date == date);
                totalHours += ( day.hoursWorked ?  Number(day.hoursWorked): 0) ;
            }
        }
        projects[projects.length - 1].days.find(ele => ele.date == 'tot'+date).hoursWorked = totalHours;
        // weekRef.projects[0].days.find(ele => ele.date == event.target.dataset.id

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