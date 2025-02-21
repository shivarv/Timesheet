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
        Map<Id, List<Id>> userIdProjectIdsMap, Set<Id> userIds, Map<Id, TimeSheet__c> userTimesheetMap, Date firstDayOfMonth, Date lastDayOfMonth) {
        List<TimeSheetEntry__c> timeSheetEntries = new List<TimeSheetEntry__c>();
        for (Date currentDate = firstDayOfMonth; currentDate <= lastDayOfMonth; currentDate = currentDate.addDays(1)) {
            for (Id userId : userIds) {
                if (userTimesheetMap.containsKey(userId)) {
                    for (Id projectId : userIdProjectIdsMap.get(userId)) {
                        timeSheetEntries.add(new TimeSheetEntry__c(
                            TimeSheet__c = userTimesheetMap.get(userId).Id,
                            Date__c = currentDate,
                            Project__c = projectId,
                            hours__c = 0 // Default value
                        ));
                    }
                }
            }
        }
        return timeSheetEntries;
    }
   
    private static Map<Id, List<Id>> getUserIdProjectIdsMap(List<User_Project__c> userProjects) {
        Map<Id, List<Id>> userIdProjectIdsMap = new  Map<Id, List<Id>>();
        for(User_Project__c userProject: userProjects) {
            List<Id> projectIds = new List<Id>();
            if(userIdProjectIdsMap.containsKey(userProject.user__c)) {
                projectIds = userIdProjectIdsMap.get(userProject.user__c);
            }
            projectIds.add(userProject.project__c);
        }
        return userIdProjectIdsMap;
    }



    global void execute(Database.BatchableContext bc, List<SObject> scope) {
        Date firstDayOfMonth = Date.today().toStartOfMonth();
        Date lastDayOfMonth = firstDayOfMonth.addMonths(1).addDays(-1);
        System.debug('execute firstDayOfMonth '+firstDayOfMonth);
        System.debug('execute lastDayOfMonth '+lastDayOfMonth);

        // Extract User IDs
        Set<Id> userIds = getUserIdsFromPSA((List<PermissionSetAssignment>) scope);
        System.debug(' userIds '+userIds);

        if (userIds.isEmpty()) {
            return;
        }
        Map<Id, TimeSheet__c> userTimesheetMap = getUserTimeSheetsMap(firstDayOfMonth);
        System.debug(' userTimesheetMap '+ userTimesheetMap);

        List<TimeSheet__c> newTimeSheets = getNewTimeSheets(
                            userIds, userTimesheetMap, firstDayOfMonth, lastDayOfMonth);
        if (!newTimeSheets.isEmpty()) {
            insert newTimeSheets;
        }
        for (TimeSheet__c ts : newTimeSheets) {
            userTimesheetMap.put(ts.User__c, ts);
        }
        System.debug(' userTimesheetMap updated '+ userTimesheetMap);
        List<User_Project__c> userProjects = [select Id, Project__c, User__c from User_Project__c];
        Map<Id, List<Id>> userIdProjectIdsMap = getUserIdProjectIdsMap(userProjects);
        System.debug(' userProjects '+ userProjects);

        // Create TimeSheetEntry Records
        List<TimeSheetEntry__c> timeSheetEntries = createTimeSheetEntries(
            userIdProjectIdsMap, userIds, userTimesheetMap,  firstDayOfMonth, lastDayOfMonth
        );

        if (!timeSheetEntries.isEmpty()) {
            insert timeSheetEntries;
        }
        System.debug(' timeSheetEntries '+ timeSheetEntries);

    }



    global void finish(Database.BatchableContext bc) {
        System.debug('TimeSheet Batch Completed');
    }
}