export enum ProductCategory {
  ELECTRONICS = 'Electronics',
  APPAREL = 'Apparel',
  HOME_GOODS = 'Home Goods',
  BOOKS = 'Books',
  SPORTS = 'Sports',
  BEAUTY = 'Beauty',
  OUTDOORS = 'Outdoors' // New Category
}

export type SelectedFilterType = ProductCategory | 'All' | 'NEW_ARRIVALS';


export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  imageUrl: string;
  category: ProductCategory;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface GroundingChunkWeb {
  uri: string;
  title: string;
}

export interface GroundingChunk {
  web?: GroundingChunkWeb;
  retrievedContext?: {
    uri: string;
    title: string;
  };
}

export interface User {
  id: string;
  email: string;
  role: 'customer' | 'admin';
  password?: string; // Added password field for customer signup
}