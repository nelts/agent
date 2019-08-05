import 'reflect-metadata';
import DecoratorNameSpace from './namespace';
import { Moment } from 'moment';

export type ScheduleDecoratorType = string | Date | Moment;

export default function Schedule(cron: ScheduleDecoratorType): MethodDecorator {
  return (target, property, descriptor) => {
    Reflect.defineMetadata(DecoratorNameSpace.SCHEDULE, cron, descriptor.value);
  }
}
  


Schedule.Auto = <MethodDecorator>function(target, property, descriptor) {
  Reflect.defineMetadata(DecoratorNameSpace.SCHEDULE_AUTO, true, descriptor.value);
}

Schedule.Run = <MethodDecorator>function(target, property, descriptor) {
  Reflect.defineMetadata(DecoratorNameSpace.SCHEDULE_RUN, true, descriptor.value);
}