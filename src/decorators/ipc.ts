import 'reflect-metadata';
import DecoratorNameSpace from './namespace';

export default (isFeedBack: boolean): MethodDecorator => {
  return (target, property, descriptor) => {
    Reflect.defineMetadata(DecoratorNameSpace.IPC, true, descriptor.value);
    Reflect.defineMetadata(DecoratorNameSpace.FEEDBACK, !!isFeedBack, descriptor.value);
  };
}