export interface Testimonials {
  name: string;
  relationShip: string;
  message: string;
  photoUrl: string;
}

export interface People {
  id?: string;
  name?: string;
  dob?: string;
  caption?: string;
  imageSrc?: string;
  primary?: string;
  secondary?: string;
  gender?: string;
  about?: string;
  testimonials?: Testimonials[];
  gallery?: string[];
}
