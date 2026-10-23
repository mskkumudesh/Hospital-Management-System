import { api, openFile } from "../api";
import type { Action, Field, PageConfig, Role } from "../types";

// Roles. `roles: []` or `write: []` means admin only (admin is always allowed).
// Keep these in step with the lists in Backend/src/routes/index.ts.
const FRONT_DESK: Role[] = ["receptionist", "nurse", "doctor"];
const BILLING: Role[] = ["receptionist", "accountant"];

// Reusable form fields
const patientField: Field = {
  key: "patient_id",
  label: "Patient",
  ref: "/patients",
  required: true,
};
const doctorField: Field = {
  key: "doctor_id",
  label: "Doctor",
  ref: "/doctors",
  required: true,
};
const departmentField: Field = {
  key: "department_id",
  label: "Department",
  ref: "/departments",
  refLabel: "name",
};

// Reusable row buttons
const pdfAction = (path: (id: number) => string): Action => ({
  label: "PDF",
  run: (r) => openFile(path(r.id)),
});
const patch = (id: number, body: object) =>
  api(`/appointments/${id}`, { method: "PATCH", body });
const asInput = (s: string) =>
  String(s).replace(" ", "T").slice(0, 16).replace("T", " ");

export const pages: Record<string, PageConfig> = {
  patients: {
    title: "Patients",
    singular: "patient",
    path: "/patients",
    roles: ["receptionist", "nurse", "doctor", "lab", "accountant"],
    write: ["receptionist", "nurse"],
    searchable: true,
    deletable: true,
    columns: ["id", "full_name", "dob", "gender", "phone", "blood_group"],
    fields: [
      { key: "full_name", label: "Full name", required: true },
      { key: "dob", label: "Date of birth", type: "date" },
      { key: "gender", label: "Gender", options: ["Female", "Male", "Other"] },
      { key: "phone", label: "Phone" },
      { key: "address", label: "Address" },
      { key: "blood_group", label: "Blood group" },
      { key: "emergency_contact", label: "Emergency contact" },
    ],
    actions: [
      {
        label: "Open",
        run: async (r) => {
          location.href = "/patients/" + r.id;
        },
      },
    ],
  },

  appointments: {
    title: "Appointments",
    singular: "appointment",
    path: "/appointments",
    roles: FRONT_DESK,
    write: ["receptionist", "nurse"],
    noEdit: true,
    columns: ["id", "patient", "doctor", "scheduled_at", "status"],
    fields: [
      patientField,
      doctorField,
      {
        key: "scheduled_at",
        label: "Date and time",
        type: "datetime-local",
        required: true,
      },
      { key: "notes", label: "Notes" },
    ],
    actions: (
      [
        {
          label: "Complete",
          when: (r) => r.status === "booked",
          run: (r) => patch(r.id, { status: "completed" }),
        },
        {
          label: "Cancel",
          when: (r) => r.status === "booked",
          run: (r) => patch(r.id, { status: "cancelled" }),
        },
        {
          label: "Reschedule",
          when: (r) => r.status === "booked",
          run: async (r) => {
            const when = prompt(
              "New date and time (YYYY-MM-DD HH:MM)",
              asInput(r.scheduled_at),
            );
            if (when) await patch(r.id, { scheduled_at: when });
          },
        },
      ] as Action[]
    ).map((a) => ({ ...a, roles: FRONT_DESK })),
  },

  doctors: {
    title: "Doctors",
    singular: "doctor",
    path: "/doctors",
    roles: [...FRONT_DESK, "accountant"],
    write: [],
    searchable: true,
    deletable: true,
    columns: [
      "id",
      "full_name",
      "department",
      "specialization",
      "consultation_fee",
    ],
    fields: [
      { key: "full_name", label: "Full name", required: true },
      departmentField,
      { key: "specialization", label: "Specialization" },
      { key: "consultation_fee", label: "Consultation fee", type: "number" },
      { key: "schedule", label: "Schedule (e.g. Mon–Fri 9–1)" },
      { key: "phone", label: "Phone" },
    ],
  },

  schedules: {
    title: "Doctor schedules",
    singular: "schedule",
    path: "/schedules",
    roles: [],
    write: [],
    deletable: true,
    columns: ["id", "doctor", "weekday", "start_time", "end_time"],
    fields: [
      doctorField,
      {
        key: "weekday",
        label: "Weekday",
        required: true,
        options: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
      },
      { key: "start_time", label: "From", type: "time", required: true },
      { key: "end_time", label: "To", type: "time", required: true },
    ],
  },

  calendar: { title: "Calendar", roles: FRONT_DESK },

  records: {
    title: "Medical records",
    singular: "record",
    path: "/records",
    roles: ["doctor", "nurse"],
    write: ["doctor"],
    deletable: true,
    columns: [
      "id",
      "patient",
      "doctor",
      "diagnosis",
      "treatment",
      "created_at",
    ],
    fields: [
      patientField,
      doctorField,
      { key: "diagnosis", label: "Diagnosis", type: "textarea" },
      { key: "prescription", label: "Prescription", type: "textarea" },
      { key: "treatment", label: "Treatment", type: "textarea" },
    ],
    actions: [pdfAction((id) => `/records/${id}/pdf`)],
  },

  admissions: {
    title: "Admissions",
    singular: "admission",
    path: "/admissions",
    roles: FRONT_DESK,
    write: ["receptionist", "nurse"],
    columns: [
      "id",
      "patient",
      "doctor",
      "ward",
      "bed_no",
      "admitted_at",
      "discharged_at",
    ],
    fields: [
      patientField,
      doctorField,
      { key: "ward", label: "Ward" },
      { key: "bed_no", label: "Bed" },
      { key: "admitted_at", label: "Admitted at", type: "datetime-local" },
      { key: "discharged_at", label: "Discharged at", type: "datetime-local" },
      { key: "daily_charge", label: "Daily charge", type: "number" },
    ],
  },

  lab: {
    title: "Lab requests",
    singular: "lab request",
    path: "/lab-requests",
    roles: ["doctor", "nurse", "lab"],
    write: ["doctor", "lab"],
    columns: ["id", "patient", "test", "status", "result"],
    fields: [
      patientField,
      {
        key: "test_id",
        label: "Test",
        ref: "/lab-tests",
        refLabel: "name",
        required: true,
      },
      {
        key: "status",
        label: "Status",
        options: ["requested", "collected", "completed"],
      },
      { key: "result", label: "Result", type: "textarea" },
    ],
    actions: [pdfAction((id) => `/lab-requests/${id}/pdf`)],
  },

  labtests: {
    title: "Lab tests",
    singular: "test",
    path: "/lab-tests",
    roles: ["lab"],
    write: ["lab"],
    columns: ["id", "name", "price"],
    fields: [
      { key: "name", label: "Test name", required: true },
      { key: "price", label: "Price", type: "number" },
    ],
  },

  pharmacy: {
    title: "Pharmacy",
    singular: "medicine",
    path: "/medicines",
    roles: ["pharmacist", "doctor"],
    write: ["pharmacist"],
    searchable: true,
    columns: [
      "id",
      "name",
      "unit_price",
      "stock_qty",
      "reorder_level",
      "expiry_date",
    ],
    fields: [
      { key: "name", label: "Medicine", required: true },
      { key: "unit_price", label: "Unit price", type: "number" },
      { key: "stock_qty", label: "Stock", type: "number" },
      { key: "reorder_level", label: "Reorder level", type: "number" },
      { key: "expiry_date", label: "Expiry date", type: "date" },
    ],
    actions: [
      {
        label: "Dispense",
        roles: ["pharmacist"],
        run: async (r) => {
          const qty = prompt("Quantity to dispense");
          if (qty)
            await api("/pharmacy/dispense", {
              method: "POST",
              body: { medicine_id: r.id, qty: Number(qty) },
            });
        },
      },
    ],
  },

  prescriptions: {
    title: "Prescriptions",
    singular: "prescription",
    path: "/prescriptions",
    roles: ["doctor", "nurse", "pharmacist"],
    write: ["doctor"],
    noEdit: true,
    columns: ["id", "patient", "medicine", "qty", "instructions", "dispensed"],
    fields: [
      patientField,
      {
        key: "medicine_id",
        label: "Medicine",
        ref: "/medicines",
        refLabel: "name",
        required: true,
      },
      { key: "qty", label: "Quantity", type: "number", required: true },
      { key: "instructions", label: "Instructions (dose, days)" },
    ],
    actions: [
      {
        label: "Dispense",
        roles: ["pharmacist"],
        when: (r) => !Number(r.dispensed),
        run: (r) => api(`/prescriptions/${r.id}/dispense`, { method: "POST" }),
      },
    ],
  },

  alerts: { title: "Stock alerts", roles: ["pharmacist", "doctor"] },

  billing: {
    title: "Billing",
    singular: "invoice",
    path: "/invoices",
    roles: BILLING,
    write: BILLING,
    noEdit: true,
    autoBill: true,
    columns: ["id", "patient", "total", "paid", "status", "created_at"],
    fields: [
      patientField,
      {
        key: "type",
        label: "Charge type",
        options: ["consultation", "laboratory", "pharmacy", "admission"],
      },
      { key: "description", label: "Description" },
      { key: "amount", label: "Amount", type: "number", required: true },
    ],
    // the form describes one charge; the API wants an invoice with items
    toBody: (v) => ({
      patient_id: v.patient_id,
      items: [
        {
          type: v.type || "consultation",
          description: v.description || "",
          amount: v.amount,
        },
      ],
    }),
    actions: [
      pdfAction((id) => `/invoices/${id}/pdf`),
      { label: "Receipt", run: (r) => openFile(`/invoices/${r.id}/receipt`) },
      {
        label: "Record payment",
        run: async (r) => {
          const amount = prompt("Amount received");
          if (amount)
            await api(`/invoices/${r.id}/payments`, {
              method: "POST",
              body: { amount: Number(amount), method: "cash" },
            });
        },
      },
    ],
  },

  reports: { title: "Reports", roles: ["accountant"] },

  staff: {
    title: "Staff",
    singular: "employee",
    path: "/employees",
    roles: [],
    write: [],
    searchable: true,
    deletable: true,
    columns: [
      "id",
      "full_name",
      "department",
      "position",
      "hire_date",
      "phone",
    ],
    fields: [
      { key: "full_name", label: "Full name", required: true },
      departmentField,
      { key: "position", label: "Position" },
      { key: "hire_date", label: "Hire date", type: "date" },
      { key: "phone", label: "Phone" },
    ],
  },

  attendance: {
    title: "Attendance",
    singular: "attendance entry",
    path: "/attendance",
    roles: [],
    write: [],
    columns: ["id", "employee", "day", "status"],
    fields: [
      {
        key: "employee_id",
        label: "Employee",
        ref: "/employees",
        required: true,
      },
      { key: "day", label: "Day", type: "date", required: true },
      {
        key: "status",
        label: "Status",
        options: ["present", "absent", "leave"],
      },
    ],
  },

  leaves: {
    title: "Leave records",
    singular: "leave",
    path: "/leaves",
    roles: [],
    write: [],
    columns: ["id", "employee", "from_date", "to_date", "reason"],
    fields: [
      {
        key: "employee_id",
        label: "Employee",
        ref: "/employees",
        required: true,
      },
      { key: "from_date", label: "From", type: "date", required: true },
      { key: "to_date", label: "To", type: "date", required: true },
      { key: "reason", label: "Reason" },
    ],
  },

  users: {
    title: "Users",
    singular: "user",
    path: "/users",
    roles: [],
    write: [],
    columns: ["id", "username", "full_name", "role", "is_active", "last_login"],
    fields: [
      { key: "username", label: "Username", required: true },
      {
        key: "password",
        label: "Password (min 8 characters; leave blank to keep)",
        type: "password",
      },
      { key: "full_name", label: "Full name" },
      {
        key: "role_id",
        label: "Role",
        ref: "/roles",
        refLabel: "name",
        required: true,
      },
      {
        key: "is_active",
        label: "Active (1 = yes, 0 = no)",
        options: ["1", "0"],
      },
    ],
  },

  audit: {
    title: "Audit log",
    singular: "entry",
    path: "/reports/audit",
    roles: [],
    readOnly: true,
    columns: ["id", "username", "action", "path", "ip", "created_at"],
  },

  account: {
    title: "My password",
    roles: [
      "doctor",
      "nurse",
      "receptionist",
      "lab",
      "pharmacist",
      "accountant",
    ],
  },
};
