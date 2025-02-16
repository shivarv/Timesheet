public with sharing class TimeSheetController {

    public class OptionWrapper {
        @AuraEnabled public String label;
        @AuraEnabled public String value;

        public OptionWrapper(String label, String value) {
            this.label = label;
            this.value = value;
        }
    }

    public class DayWrapper {
        @AuraEnabled public Date dayRecordDate; //projectId, date
        @AuraEnabled public Decimal hours; //projectId, date
        @AuraEnabled public Boolean isDisabled; //projectId, date
        public DayWrapper(Date dayRecordDate, Decimal hours, Boolean isDisabled) {
            this.dayRecordDate = dayRecordDate;
            this.hours = hours;
            this.isDisabled = isDisabled;
        }
    }
    
    public class TimeSheetWrapper{
        @AuraEnabled
        public Id timesheetId;
        @AuraEnabled
        public List<OptionWrapper> projectOptions{get; set;}
        @AuraEnabled
        public Map<Id, List<DayWrapper>> projectDaysWrapper{get; set;}

    }

    //timesheet should be based on month
    @AuraEnabled
    public static TimeSheetWrapper getInitData(String inputDateString) {
        Date inputDate = Date.valueOf(inputDateString);
        Set<Id> projectIds = new Set<Id>();
        TimeSheetWrapper rec = new TimeSheetWrapper();
        List<OptionWrapper> projectOptions = new List<OptionWrapper>();
        List<Project__c> projectRecords = getProjectsDetail();
        for(Project__c projectRecord: projectRecords) {
            projectIds.add(projectRecord.Id);
            projectOptions.add(new OptionWrapper(projectRecord.project_code__c, projectRecord.Id));
        }
        rec.projectOptions = projectOptions;
        rec.timesheetId = [select id, User__c, Start_Date__c, End_Date__c from TimeSheet__c
                            WHERE User__c = :UserInfo.getUserId()
                            AND Start_Date__c <= :inputDate
                            AND End_Date__c >= :inputDate
                            LIMIT 1].Id;
        rec.projectDaysWrapper = getDayWrapper(projectIds, rec.timesheetId);
        return rec;
    }

    //it has to be with sharing
    public static Map<Id, List<DayWrapper>> getDayWrapper(Set<Id> projectIds, Id timeSheetId) {
        Map<Id, List<DayWrapper>> output = new Map<Id, List<DayWrapper>>();
        List<TimeSheetEntry__c> timesheetEntries = [select date__c, 
                            project__c, hours__c, timesheet__c from TimeSheetEntry__c order by date__c];
        for(TimeSheetEntry__c tse: timesheetEntries) {
            List<DayWrapper> dayList = new List<DayWrapper>();
            //DayWrapper(String dayRecordDate, Decimal hours, Boolean isDisabled)
            if(output.containsKey(tse.project__c)) {
                dayList = output.get(tse.project__c);
            } 
            dayList.add(new DayWrapper(tse.date__c, tse.hours__c, isDateWeekend(tse.date__c)));
            output.put(tse.project__c, dayList);
        }
        return output;
    }

    private static Boolean isDateWeekend(Date weekDate) {
        Integer dayOfWeek = ((weekDate.toStartOfWeek().daysBetween(weekDate)) + 1);

        return  (dayOfWeek == 7 || dayOfWeek == 6);

    }

    @AuraEnabled
    public static List<Project__c> getProjectsDetail() {
        return [select id, Name, project_code__c from Project__c];
    }
}