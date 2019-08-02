import 'reflect-metadata';
import DecoratorNameSpace from './namespace';

export default <ClassDecorator>(target => Reflect.defineMetadata(DecoratorNameSpace.AUTO, true, target));