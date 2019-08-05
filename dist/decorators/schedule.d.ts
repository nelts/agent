import 'reflect-metadata';
import { Moment } from 'moment';
export declare type ScheduleDecoratorType = string | Date | Moment;
declare function Schedule(cron: ScheduleDecoratorType): MethodDecorator;
declare namespace Schedule {
    var Auto: MethodDecorator;
    var Run: MethodDecorator;
}
export default Schedule;
