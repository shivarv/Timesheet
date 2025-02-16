global class TimeSheetCreationBatch implements Database.Batchable<SObject> {
    global Database.QueryLocator start(Database.BatchableContext bc) {
        // Fetch users with TimeSheetUser Permission Set
        return Database.getQueryLocator([
            SELECT AssigneeId FROM PermissionSetAssignment 
            WHERE PermissionSet.Name = 'TimeSheetUser'
        ]);
    }

    private static Set<Id> getUserIdsFromPSA(List<PermissionSetAssignment> psaList) {
        Set<Id> userIds = new Set<Id>();
        for (PermissionSetAssignment psa : psaList) {
            userIds.add(psa.AssigneeId);
        }
        return userIds;
    }

    
    private static Map<Id, TimeSheet__c> getUserTimeSheetsMap(Date firstDayOfMonth) {
        Map<Id, TimeSheet__c> existingTimeSheets = new Map<Id, TimeSheet__c>();
        for (TimeSheet__c ts : [SELECT Id, User__c FROM TimeSheet__c WHERE Start_Date__c = :firstDayOfMonth]) {
            existingTimeSheets.put(ts.User__c, ts);
        }
        return existingTimeSheets;
    }


    private static List<TimeSheet__c> getNewTimeSheets(Set<Id> userIds, Map<Id, TimeSheet__c> userTimesheetMap,
        Date firstDayOfMonth, Date lastDayOfMonth) {
        List<TimeSheet__c> newTimeSheets = new List<TimeSheet__c>();
        for (Id userId : userIds) {
            if (!userTimesheetMap.containsKey(userId)) {
                TimeSheet__c ts = new TimeSheet__c(
                    User__c = userId,
                    Start_Date__c = firstDayOfMonth,
                    End_Date__c = lastDayOfMonth
                );
                newTimeSheets.add(ts);
            }
        }
        return newTimeSheets;
    }

    private static List<TimeSheetEntry__c> createTimeSheetEntries(
        List<Project__c> projects, Set<Id> userIds, Map<Id, TimeSheet__c> userTimesheetMap, Date firstDayOfMonth, Date lastDayOfMonth) {
        List<TimeSheetEntry__c> timeSheetEntries = new List<TimeSheetEntry__c>();
        for (Date currentDate = firstDayOfMonth; currentDate <= lastDayOfMonth; currentDate = currentDate.addDays(1)) {
            for (Id userId : userIds) {
                if (userTimesheetMap.containsKey(userId)) {
                    for (Project__c project : projects) {
                        timeSheetEntries.add(new TimeSheetEntry__c(
                            TimeSheet__c = userTimesheetMap.get(userId).Id,
                            Date__c = currentDate,
                            Project__c = project.Id,
                            hours__c = 0 // Default value
                        ));
                    }
                }
            }
        }
        return timeSheetEntries;
    }
   


    global void execute(Database.BatchableContext bc, List<SObject> scope) {
        Date firstDayOfMonth = Date.today().toStartOfMonth();
        Date lastDayOfMonth = firstDayOfMonth.addMonths(1).addDays(-1);

        // Extract User IDs
        Set<Id> userIds = getUserIdsFromPSA((List<PermissionSetAssignment>) scope);
        if (userIds.isEmpty()) {
            return;
        }
        Map<Id, TimeSheet__c> userTimesheetMap = getUserTimeSheetsMap(firstDayOfMonth);
        List<TimeSheet__c> newTimeSheets = getNewTimeSheets(
                            userIds, userTimesheetMap, firstDayOfMonth, lastDayOfMonth);
        if (!newTimeSheets.isEmpty()) {
            insert newTimeSheets;
        }
        for (TimeSheet__c ts : newTimeSheets) {
            userTimesheetMap.put(ts.User__c, ts);
        }
        // Fetch Active Projects
        List<Project__c> projects = [SELECT Id, Name , project_code__c FROM Project__c];

        // Create TimeSheetEntry Records
        List<TimeSheetEntry__c> timeSheetEntries = createTimeSheetEntries(
            projects, userIds, userTimesheetMap,  firstDayOfMonth, lastDayOfMonth
        );

        if (!timeSheetEntries.isEmpty()) {
            insert timeSheetEntries;
        }
    }

    global void finish(Database.BatchableContext bc) {
        System.debug('TimeSheet Batch Completed');
    }
}
