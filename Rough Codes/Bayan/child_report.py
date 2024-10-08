import frappe

# maximum number of EMIs for a Credit Card EMI
# case when EMI is paid in 1 year
NUM_MAX_EMI = 12


def execute(filters=None):
 columns = get_columns()
 data = get_data(filters)

 return columns, data


def get_columns():
 columns = [
  {
   "label": "Credit Card EMI",
   "fieldname": "credit_card_emi",
   "fieldtype": "Link",
   "options": "Credit Card EMI",
  },
  {
   "label": "Customer Name",
   "fieldname": "customer_name",
   "fieldtype": "Data",
  },
  {
   "label": "Scheme",
   "fieldname": "scheme",
   "fieldtype": "Data",
  },
 ]

 # 1 column for each EMI
 for i in range(1, NUM_MAX_EMI + 1):
  columns.append(
   {
    "label": "EMI {}".format(i),
    "fieldname": "emi_{}".format(i),
    "fieldtype": "Data",
    "options": "EMI",
   }
  )

 return columns


def get_data(filters=None):
 data = []

 credit_card_emis = frappe.get_all(
  "Credit Card EMI", fields=["name", "customer_name", "scheme"]
 )

 for credit_card_emi in credit_card_emis:
  row = {
   "credit_card_emi": credit_card_emi.name,
   "customer_name": credit_card_emi.customer_name,
   "scheme": credit_card_emi.scheme,
  }

  # get all EMIs (child items) for the Credit Card EMI
  emis = frappe.get_all(
   "EMI",
   fields=["amount", "due_date", "paid", "idx"],
   filters={"parent": credit_card_emi.name},
  )

  # e.g. emi_1 = 1000, emi_2 = 2000, emi_3 = 3000, etc.
  for emi in emis:
   row["emi_{}".format(emi.idx)] = format_currency(emi.amount)

  # set rest of the EMI columns to "-"
  for i in range(1, MAX_EMI + 1):
   if "emi_{}".format(i) not in row:
    row["emi_{}".format(i)] = "-"

  data.append(row)

 return data


def format_currency(value, currency="INR"):
 return frappe.format_value(value, df={"fieldtype": "Currency"}, currency=currency)