import { CreateLabelDto } from '../dto';

export interface LabelUpdate extends CreateLabelDto {
  id: string;
}
