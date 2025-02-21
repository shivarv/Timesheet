import { LightningElement, track } from 'lwc';

export default class TimeSheetContainer2 extends LightningElement {

    @track currentMonth;
    @track currentYear;
    @track weeks = []; // Stores rows of dates (each row has 7 days)
    
    weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    connectedCallback() {
        let today = new Date();
        this.currentMonth = today.getMonth();
        this.currentYear = today.getFullYear();
        this.generateCalendar();
    }

    generateCalendar() {
        this.weeks = [];
        let firstDay = new Date(this.currentYear, this.currentMonth, 1);
        let lastDate = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
        
        let startDay = (firstDay.getDay() + 6) % 7; // Adjust to make Monday the first day
        let daysArray = [];

        // Fill leading empty spaces
        for (let i = 0; i < startDay; i++) {
            daysArray.push('');
        }

        // Fill dates in DD-MM-YYYY format
        for (let date = 1; date <= lastDate; date++) {
            let formattedDate = `${date}-${this.currentMonth + 1}-${this.currentYear}`;
            daysArray.push(formattedDate);
        }

        // Fill trailing empty spaces to maintain a full last row
        while (daysArray.length % 7 !== 0) {
            daysArray.push('');
        }

        // Split into weeks (chunks of 7)
        for (let i = 0; i < daysArray.length; i += 7) {
            this.weeks.push(daysArray.slice(i, i + 7));
        }
    }

    previousMonth() {
        this.currentMonth -= 1;
        if (this.currentMonth < 0) {
            this.currentMonth = 11;
            this.currentYear -= 1;
        }
        this.generateCalendar();
    }

    nextMonth() {
        this.currentMonth += 1;
        if (this.currentMonth > 11) {
            this.currentMonth = 0;
            this.currentYear += 1;
        }
        this.generateCalendar();
    }
}