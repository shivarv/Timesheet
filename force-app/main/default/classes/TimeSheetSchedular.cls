global class TimeSheetSchedular implements Schedulable {
    global void execute(SchedulableContext sc) {
        callTimeSheetBatch();
    }

    public static void callTimeSheetBatch() {
        TimeSheetCreationBatch batch = new TimeSheetCreationBatch();

        Database.executeBatch(batch);
    }
}
