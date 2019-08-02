import 'reflect-metadata';
import DecoratorNameSpace from './namespace';
import { Moment } from 'moment';

export type ScheduleDecoratorType = {
  cron: string | Date | Moment,
  runOnInit?: boolean,
}

export default (cron: string | Date | Moment, runOnInit?: boolean): MethodDecorator => 
  (target, property, descriptor) => 
    Reflect.defineMetadata(DecoratorNameSpace.SCHEDULE, { cron, runOnInit }, descriptor.value);
