-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.users (
  id character varying NOT NULL,
  name character varying NOT NULL,
  username character varying NOT NULL UNIQUE,
  password character varying NOT NULL,
  email character varying NOT NULL UNIQUE,
  phone character varying,
  cccd character varying,
  role character varying NOT NULL CHECK (role::text = ANY (ARRAY['CUSTOMER'::text, 'STAFF'::text, 'FMANAGER'::text, 'FACILITY_MANAGER'::text, 'OPS_MGR'::text, 'OPS_MANAGER'::text, 'ADMIN'::text, 'SYSTEM_ADMIN'::text])),
  role_title character varying,
  facility character varying,
  facility_code character varying,
  status character varying DEFAULT 'ACTIVE'::text CHECK (status::text = ANY (ARRAY['ACTIVE'::text, 'LOCKED'::text, 'DISABLED'::text])),
  created_at timestamp with time zone DEFAULT now(),
  email_verified boolean NOT NULL DEFAULT true,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);
CREATE TABLE public.facilities (
  code character varying NOT NULL,
  name character varying NOT NULL,
  address character varying NOT NULL,
  city character varying NOT NULL,
  hotline character varying,
  total_units integer DEFAULT 0,
  occupied_units integer DEFAULT 0,
  occupancy_rate numeric DEFAULT 0.00,
  status character varying DEFAULT 'ACTIVE'::text,
  CONSTRAINT facilities_pkey PRIMARY KEY (code)
);
CREATE TABLE public.units (
  code character varying NOT NULL,
  facility_code character varying,
  type character varying NOT NULL CHECK (type::text = ANY (ARRAY['S'::text, 'M'::text, 'L'::text, 'CLIMATE'::text])),
  size_desc character varying,
  size_sqm numeric NOT NULL,
  price_per_month numeric NOT NULL,
  status character varying NOT NULL DEFAULT 'available'::text CHECK (status::text = ANY (ARRAY['available'::text, 'reserved'::text, 'occupied'::text, 'cleaning'::text, 'maintenance'::text])),
  tenant_name character varying,
  pin_code character varying DEFAULT '842916'::text,
  floor integer,
  temporary_pin character varying,
  temporary_pin_expires_at timestamp without time zone,
  CONSTRAINT units_pkey PRIMARY KEY (code),
  CONSTRAINT units_facility_code_fkey FOREIGN KEY (facility_code) REFERENCES public.facilities(code)
);
CREATE TABLE public.reservations (
  id character varying NOT NULL,
  user_id character varying,
  customer_name character varying NOT NULL,
  customer_phone character varying,
  facility_code character varying,
  unit_type character varying NOT NULL,
  unit_code character varying,
  duration_months integer DEFAULT 1,
  start_date date NOT NULL,
  deposit_amount numeric NOT NULL,
  status character varying DEFAULT 'PENDING_PAYMENT'::text CHECK (status::text = ANY (ARRAY['PENDING_PAYMENT'::text, 'RESERVED'::text, 'CHECKED_IN'::text, 'CANCELLED'::text, 'EXPIRED'::text])),
  created_at timestamp with time zone DEFAULT now(),
  appointment character varying,
  CONSTRAINT reservations_pkey PRIMARY KEY (id),
  CONSTRAINT reservations_facility_code_fkey FOREIGN KEY (facility_code) REFERENCES public.facilities(code),
  CONSTRAINT reservations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.contracts (
  id character varying NOT NULL,
  reservation_id character varying,
  user_id character varying,
  customer_name character varying NOT NULL,
  unit_code character varying,
  facility_code character varying,
  start_date date NOT NULL,
  end_date date NOT NULL,
  monthly_fee numeric NOT NULL,
  deposit_fee numeric NOT NULL,
  status character varying DEFAULT 'ACTIVE'::text CHECK (status::text = ANY (ARRAY['ACTIVE'::text, 'EXPIRING_SOON'::text, 'OVERDUE'::text, 'TERMINATED'::text])),
  created_at timestamp with time zone DEFAULT now(),
  checkout_requested_at timestamp without time zone,
  checkout_requested_date date,
  customer_phone character varying,
  duration_months integer,
  last_renewal_at timestamp without time zone,
  physical_lock character varying,
  pin_code character varying,
  rfid_card character varying,
  CONSTRAINT contracts_pkey PRIMARY KEY (id),
  CONSTRAINT contracts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT contracts_unit_code_fkey FOREIGN KEY (unit_code) REFERENCES public.units(code)
);
CREATE TABLE public.payments (
  id character varying NOT NULL,
  reservation_id character varying,
  contract_id character varying,
  customer_name character varying,
  invoice_type character varying NOT NULL CHECK (invoice_type::text = ANY (ARRAY['DEPOSIT'::text, 'RENT'::text, 'RENEW'::text, 'EXTRA'::text])),
  amount numeric NOT NULL,
  payment_method character varying DEFAULT 'VIETQR_NAPAS247'::text,
  transaction_code character varying,
  status character varying DEFAULT 'PAID'::text CHECK (status::text = ANY (ARRAY['PENDING'::text, 'PAID'::text, 'FAILED'::text, 'REFUNDED'::text])),
  created_at timestamp with time zone DEFAULT now(),
  time_str character varying,
  CONSTRAINT payments_pkey PRIMARY KEY (id)
);
CREATE TABLE public.support_tickets (
  id character varying NOT NULL,
  user_id character varying,
  customer_name character varying NOT NULL,
  unit_code character varying,
  category character varying NOT NULL,
  priority character varying DEFAULT 'NORMAL'::text CHECK (priority::text = ANY (ARRAY['NORMAL'::text, 'HIGH'::text, 'URGENT'::text])),
  description text NOT NULL,
  status character varying DEFAULT 'OPEN'::text CHECK (status::text = ANY (ARRAY['OPEN'::text, 'IN_PROGRESS'::text, 'RESOLVED'::text, 'CLOSED'::text])),
  created_at timestamp with time zone DEFAULT now(),
  attachment_url character varying,
  facility_code character varying,
  feedback text,
  notes character varying,
  rating integer,
  resolved_at timestamp without time zone,
  staff_assigned character varying,
  title character varying NOT NULL,
  CONSTRAINT support_tickets_pkey PRIMARY KEY (id),
  CONSTRAINT support_tickets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.staff_tasks (
  id text NOT NULL,
  staff_name text NOT NULL,
  facility_code text,
  task_title text NOT NULL,
  task_type text CHECK (task_type = ANY (ARRAY['CHECKIN'::text, 'RETURN'::text, 'SUPPORT'::text, 'MAINTENANCE'::text])),
  unit_code text,
  priority text DEFAULT 'MEDIUM'::text,
  status text DEFAULT 'PENDING'::text CHECK (status = ANY (ARRAY['PENDING'::text, 'IN_PROGRESS'::text, 'COMPLETED'::text])),
  due_date date DEFAULT CURRENT_DATE,
  CONSTRAINT staff_tasks_pkey PRIMARY KEY (id)
);
CREATE TABLE public.audit_logs (
  id bigint NOT NULL DEFAULT nextval('audit_logs_id_seq'::regclass),
  time_display text,
  user_name character varying NOT NULL,
  role character varying NOT NULL,
  action character varying NOT NULL,
  detail character varying NOT NULL,
  ip_address text DEFAULT '127.0.0.1'::text,
  status character varying DEFAULT 'SUCCESS'::text,
  created_at timestamp with time zone DEFAULT now(),
  ip character varying,
  time_str character varying,
  CONSTRAINT audit_logs_pkey PRIMARY KEY (id)
);
CREATE TABLE public.login_history (
  id character varying NOT NULL,
  username character varying NOT NULL,
  name character varying NOT NULL,
  role character varying NOT NULL,
  login_time timestamp with time zone DEFAULT now(),
  ip_address text,
  device character varying,
  status character varying DEFAULT 'SUCCESS'::text,
  created_at timestamp without time zone,
  ip character varying,
  time_str character varying,
  CONSTRAINT login_history_pkey PRIMARY KEY (id)
);
CREATE TABLE public.business_policies (
  policy_key character varying NOT NULL,
  policy_value text NOT NULL,
  updated_at timestamp without time zone NOT NULL,
  updated_by character varying,
  CONSTRAINT business_policies_pkey PRIMARY KEY (policy_key)
);
CREATE TABLE public.daily_tasks (
  id character varying NOT NULL,
  contract_id character varying,
  created_at timestamp without time zone,
  deadline character varying,
  due_date date,
  facility_code character varying,
  reservation_id character varying,
  staff character varying NOT NULL,
  staff_id character varying,
  status character varying,
  task_type character varying,
  title character varying NOT NULL,
  unit_code character varying,
  CONSTRAINT daily_tasks_pkey PRIMARY KEY (id)
);
CREATE TABLE public.handover_records (
  id character varying NOT NULL,
  contract_id character varying NOT NULL,
  customer_signature_confirmed boolean NOT NULL,
  handover_date timestamp without time zone NOT NULL,
  lock_type character varying,
  reservation_id character varying NOT NULL,
  staff_id character varying NOT NULL,
  unit_condition_notes text,
  CONSTRAINT handover_records_pkey PRIMARY KEY (id)
);
CREATE TABLE public.inspection_records (
  id character varying NOT NULL,
  cleanliness_status character varying,
  is_cleared boolean NOT NULL,
  contract_id character varying NOT NULL,
  damage_notes text,
  deposit_refund_amount numeric NOT NULL,
  inspection_date timestamp without time zone NOT NULL,
  penalty_fee numeric NOT NULL,
  staff_id character varying NOT NULL,
  CONSTRAINT inspection_records_pkey PRIMARY KEY (id)
);
CREATE TABLE public.refund_requests (
  id character varying NOT NULL,
  approved_amount numeric NOT NULL,
  completed_at timestamp without time zone,
  contract_id character varying,
  created_at timestamp without time zone NOT NULL,
  facility_code character varying NOT NULL,
  inspection_id character varying,
  payment_id character varying,
  reservation_id character varying,
  status character varying NOT NULL,
  CONSTRAINT refund_requests_pkey PRIMARY KEY (id)
);
