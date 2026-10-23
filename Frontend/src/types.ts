export type Role = 'admin' | 'doctor' | 'nurse' | 'receptionist' | 'lab' | 'pharmacist' | 'accountant';
export type Row = Record<string, any>;

export interface User {
  id: number;
  name: string;
  role: Role;
}
export interface Session {
  token: string;
  user: User;
}

/** One input in an add/edit form. */
export interface Field {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'date' | 'time' | 'datetime-local' | 'password' | 'textarea';
  required?: boolean;
  options?: string[]; // fixed choices
  ref?: string; // API path to load choices from
  refLabel?: string; // which column to show for those choices (default full_name)
}

/** A button on a table row. */
export interface Action {
  label: string;
  run: (row: Row) => Promise<unknown>;
  when?: (row: Row) => boolean;
  roles?: Role[]; // omit = anyone who can see the page
}

/** Describes one page; the generic Resource component renders it. */
export interface PageConfig {
  title: string;
  roles: Role[]; // who sees it in the menu (admin always does)
  // everything below is only for table pages
  singular?: string;
  path?: string;
  columns?: string[];
  fields?: Field[];
  write?: Role[]; // who may add/edit
  actions?: Action[];
  searchable?: boolean;
  deletable?: boolean;
  readOnly?: boolean;
  noEdit?: boolean;
  autoBill?: boolean;
  toBody?: (values: Row) => Row;
}
