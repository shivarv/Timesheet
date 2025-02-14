public with sharing class TimeSheetController {

    public class OptionWrapper {
        @AuraEnabled public String label;
        @AuraEnabled public String value;

        public OptionWrapper(String label, String value) {
            this.label = label;
            this.value = value;
        }
    }
    
    public class TimeSheetWrapper{
        @AuraEnabled
        public List<OptionWrapper> projectOptions{get; set;}
    }

    @AuraEnabled
    public static TimeSheetWrapper getInitData() {
        TimeSheetWrapper rec = new TimeSheetWrapper();
        List<OptionWrapper> projectOptions = new List<OptionWrapper>();
        List<Project__c> projectRecords = getProjectsDetail();
        for(Project__c projectRecord: projectRecords) {
            projectOptions.add(new OptionWrapper(projectRecord.project_code__c, projectRecord.Id));
        }
        rec.projectOptions = projectOptions;
        return rec;
    }

    @AuraEnabled
   public static List<Project__c> getProjectsDetail() {
        return [select id, Name, project_code__c from Project__c];
   }
}