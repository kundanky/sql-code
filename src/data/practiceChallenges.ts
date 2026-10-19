export interface PracticeChallenge {
  id: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  order: number;
  title: string;
  category: string;
  description: string;
  hint: string;
  starterSql: string;
  seedSql: string;
  solutionSql: string;
}

export const PRACTICE_CHALLENGES: PracticeChallenge[] = [
  // ==========================================
  // LEVEL 1: BEGINNER (10 Challenges)
  // ==========================================
  {
    id: 'beg-1',
    level: 'beginner',
    order: 1,
    title: '1. Select All Columns',
    category: 'SELECT',
    description: 'Retrieve all columns and all rows from the `employees` table.',
    hint: 'Use the asterisk (*) wildcard with the SELECT statement from employees.',
    starterSql: 'SELECT * FROM employees;',
    seedSql: `
      CREATE TABLE employees (id INTEGER PRIMARY KEY, name TEXT, department TEXT, salary INTEGER);
      INSERT INTO employees VALUES (1, 'Alice', 'Engineering', 95000), (2, 'Bob', 'Design', 75000), (3, 'Charlie', 'Engineering', 105000);
    `,
    solutionSql: 'SELECT * FROM employees;'
  },
  {
    id: 'beg-2',
    level: 'beginner',
    order: 2,
    title: '2. Filter Rows with WHERE',
    category: 'WHERE',
    description: 'Find all employees who work in the "Engineering" department. Return their `name` and `salary`.',
    hint: 'Filter using WHERE department = \'Engineering\' and specify name, salary in SELECT.',
    starterSql: 'SELECT name, salary FROM employees WHERE ...;',
    seedSql: `
      CREATE TABLE employees (id INTEGER PRIMARY KEY, name TEXT, department TEXT, salary INTEGER);
      INSERT INTO employees VALUES (1, 'Alice', 'Engineering', 95000), (2, 'Bob', 'Marketing', 68000), (3, 'Charlie', 'Engineering', 105000), (4, 'Diana', 'HR', 72000);
    `,
    solutionSql: "SELECT name, salary FROM employees WHERE department = 'Engineering';"
  },
  {
    id: 'beg-3',
    level: 'beginner',
    order: 3,
    title: '3. Sorting Results with ORDER BY',
    category: 'ORDER BY',
    description: 'List all products with columns `title` and `price`, ordered from most expensive to least expensive.',
    hint: 'Use ORDER BY price DESC.',
    starterSql: 'SELECT title, price FROM products ORDER BY ...;',
    seedSql: `
      CREATE TABLE products (id INTEGER PRIMARY KEY, title TEXT, price REAL);
      INSERT INTO products VALUES (1, 'Keyboard', 89.99), (2, 'Mouse', 49.50), (3, 'Monitor', 299.00), (4, 'Webcam', 79.00);
    `,
    solutionSql: 'SELECT title, price FROM products ORDER BY price DESC;'
  },
  {
    id: 'beg-4',
    level: 'beginner',
    order: 4,
    title: '4. Restricting Rows with LIMIT',
    category: 'LIMIT',
    description: 'Retrieve the top 2 highest paid employees from the `employees` table. Return `name` and `salary`.',
    hint: 'Order by salary descending and append LIMIT 2.',
    starterSql: 'SELECT name, salary FROM employees ORDER BY salary DESC ...;',
    seedSql: `
      CREATE TABLE employees (id INTEGER PRIMARY KEY, name TEXT, salary INTEGER);
      INSERT INTO employees VALUES (1, 'Marcus', 82000), (2, 'Elena', 115000), (3, 'David', 98000), (4, 'Sophia', 130000);
    `,
    solutionSql: 'SELECT name, salary FROM employees ORDER BY salary DESC LIMIT 2;'
  },
  {
    id: 'beg-5',
    level: 'beginner',
    order: 5,
    title: '5. Pattern Matching with LIKE',
    category: 'LIKE',
    description: 'Find all customers whose email address ends with "@company.com". Return their `name` and `email`.',
    hint: 'Use LIKE \'%@company.com\' in your WHERE clause.',
    starterSql: 'SELECT name, email FROM customers WHERE email LIKE ...;',
    seedSql: `
      CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT, email TEXT);
      INSERT INTO customers VALUES (1, 'Sarah', 'sarah@company.com'), (2, 'Tom', 'tom@gmail.com'), (3, 'Lisa', 'lisa@company.com'), (4, 'Jake', 'jake@yahoo.com');
    `,
    solutionSql: "SELECT name, email FROM customers WHERE email LIKE '%@company.com';"
  },
  {
    id: 'beg-6',
    level: 'beginner',
    order: 6,
    title: '6. Multiple Conditions (AND / OR)',
    category: 'WHERE',
    description: 'Select all products where `price` is less than 50.00 AND `stock` is greater than 10. Return `name`, `price`, `stock`.',
    hint: 'Combine conditions using the AND keyword.',
    starterSql: 'SELECT name, price, stock FROM products WHERE ...;',
    seedSql: `
      CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT, price REAL, stock INTEGER);
      INSERT INTO products VALUES (1, 'Notebook', 12.50, 45), (2, 'Pen Set', 8.00, 5), (3, 'Backpack', 65.00, 20), (4, 'Desk Lamp', 35.00, 15);
    `,
    solutionSql: 'SELECT name, price, stock FROM products WHERE price < 50.00 AND stock > 10;'
  },
  {
    id: 'beg-7',
    level: 'beginner',
    order: 7,
    title: '7. Dealing with NULL Values',
    category: 'NULL',
    description: 'Find all users who do not have a phone number (`phone` IS NULL). Return `id` and `username`.',
    hint: 'In SQL, never use = NULL; use the IS NULL operator.',
    starterSql: 'SELECT id, username FROM users WHERE ...;',
    seedSql: `
      CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT, phone TEXT);
      INSERT INTO users VALUES (1, 'neo', '555-0199'), (2, 'trinity', NULL), (3, 'morpheus', NULL), (4, 'cypher', '555-0142');
    `,
    solutionSql: 'SELECT id, username FROM users WHERE phone IS NULL;'
  },
  {
    id: 'beg-8',
    level: 'beginner',
    order: 8,
    title: '8. Aggregations with COUNT & SUM',
    category: 'AGGREGATE',
    description: 'Calculate the total number of orders as `total_orders` and the sum of `amount` as `total_revenue` from the `orders` table.',
    hint: 'Use COUNT(*) AS total_orders, SUM(amount) AS total_revenue.',
    starterSql: 'SELECT COUNT(*) AS total_orders, SUM(...) AS total_revenue FROM orders;',
    seedSql: `
      CREATE TABLE orders (id INTEGER PRIMARY KEY, customer_id INTEGER, amount REAL);
      INSERT INTO orders VALUES (101, 1, 150.00), (102, 2, 220.50), (103, 1, 79.50), (104, 3, 310.00);
    `,
    solutionSql: 'SELECT COUNT(*) AS total_orders, SUM(amount) AS total_revenue FROM orders;'
  },
  {
    id: 'beg-9',
    level: 'beginner',
    order: 9,
    title: '9. Grouping Rows with GROUP BY',
    category: 'GROUP BY',
    description: 'Find the number of employees in each department. Return `department` and `employee_count`, ordered by `employee_count` descending.',
    hint: 'Use GROUP BY department and COUNT(*) AS employee_count.',
    starterSql: 'SELECT department, COUNT(*) AS employee_count FROM employees GROUP BY ...;',
    seedSql: `
      CREATE TABLE employees (id INTEGER PRIMARY KEY, name TEXT, department TEXT);
      INSERT INTO employees VALUES (1, 'Anna', 'Sales'), (2, 'Ben', 'Engineering'), (3, 'Chloe', 'Sales'), (4, 'Dan', 'Engineering'), (5, 'Emma', 'Sales');
    `,
    solutionSql: 'SELECT department, COUNT(*) AS employee_count FROM employees GROUP BY department ORDER BY employee_count DESC;'
  },
  {
    id: 'beg-10',
    level: 'beginner',
    order: 10,
    title: '10. Filter Groups with HAVING',
    category: 'HAVING',
    description: 'List the departments that have more than 1 employee. Return `department` and `count`.',
    hint: 'Use HAVING COUNT(*) > 1 after GROUP BY department.',
    starterSql: 'SELECT department, COUNT(*) AS count FROM employees GROUP BY department HAVING ...;',
    seedSql: `
      CREATE TABLE employees (id INTEGER PRIMARY KEY, name TEXT, department TEXT);
      INSERT INTO employees VALUES (1, 'Aaron', 'Design'), (2, 'Beth', 'Engineering'), (3, 'Carl', 'Engineering'), (4, 'Deb', 'HR');
    `,
    solutionSql: 'SELECT department, COUNT(*) AS count FROM employees GROUP BY department HAVING COUNT(*) > 1;'
  },

  // ==========================================
  // LEVEL 2: INTERMEDIATE (10 Challenges)
  // ==========================================
  {
    id: 'int-1',
    level: 'intermediate',
    order: 11,
    title: '11. Inner Join Between Tables',
    category: 'JOIN',
    description: 'Join `orders` and `customers` to return each order\'s `id`, `customer_name` (as `customer`), and `total_amount`. Order by order `id` ascending.',
    hint: 'JOIN customers ON orders.customer_id = customers.id.',
    starterSql: 'SELECT orders.id, customers.name AS customer, orders.total_amount FROM orders JOIN ...;',
    seedSql: `
      CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT);
      CREATE TABLE orders (id INTEGER PRIMARY KEY, customer_id INTEGER, total_amount REAL);
      INSERT INTO customers VALUES (1, 'Maya'), (2, 'Liam'), (3, 'Noah');
      INSERT INTO orders VALUES (501, 1, 99.00), (502, 2, 149.50), (503, 1, 45.00);
    `,
    solutionSql: 'SELECT orders.id, customers.name AS customer, orders.total_amount FROM orders JOIN customers ON orders.customer_id = customers.id ORDER BY orders.id ASC;'
  },
  {
    id: 'int-2',
    level: 'intermediate',
    order: 12,
    title: '12. Left Join for Missing Records',
    category: 'JOIN',
    description: 'Find all customers who have NEVER placed an order. Return their `id` and `name`.',
    hint: 'Use LEFT JOIN orders ON customers.id = orders.customer_id WHERE orders.id IS NULL.',
    starterSql: 'SELECT customers.id, customers.name FROM customers LEFT JOIN orders ...;',
    seedSql: `
      CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT);
      CREATE TABLE orders (id INTEGER PRIMARY KEY, customer_id INTEGER);
      INSERT INTO customers VALUES (1, 'Arthur'), (2, 'Beatrice'), (3, 'Charles'), (4, 'Diana');
      INSERT INTO orders VALUES (10, 1), (11, 3);
    `,
    solutionSql: 'SELECT customers.id, customers.name FROM customers LEFT JOIN orders ON customers.id = orders.customer_id WHERE orders.id IS NULL;'
  },
  {
    id: 'int-3',
    level: 'intermediate',
    order: 13,
    title: '13. Multi-Table Join',
    category: 'JOIN',
    description: 'Join `orders`, `order_items`, and `products`. Return `orders.id` as `order_id`, `products.title`, and `order_items.quantity`. Order by order_id, title.',
    hint: 'Chain two JOIN clauses connecting orders to order_items, then order_items to products.',
    starterSql: 'SELECT orders.id AS order_id, products.title, order_items.quantity FROM orders ...;',
    seedSql: `
      CREATE TABLE products (id INTEGER PRIMARY KEY, title TEXT);
      CREATE TABLE orders (id INTEGER PRIMARY KEY);
      CREATE TABLE order_items (order_id INTEGER, product_id INTEGER, quantity INTEGER);
      INSERT INTO products VALUES (1, 'USB Cable'), (2, 'Power Bank');
      INSERT INTO orders VALUES (101), (102);
      INSERT INTO order_items VALUES (101, 1, 2), (101, 2, 1), (102, 1, 1);
    `,
    solutionSql: 'SELECT orders.id AS order_id, products.title, order_items.quantity FROM orders JOIN order_items ON orders.id = order_items.order_id JOIN products ON order_items.product_id = products.id ORDER BY order_id, title;'
  },
  {
    id: 'int-4',
    level: 'intermediate',
    order: 14,
    title: '14. Average and Rounding',
    category: 'AGGREGATE',
    description: 'Calculate the average salary by department rounded to 2 decimal places as `avg_salary`. Order by `department`.',
    hint: 'Use ROUND(AVG(salary), 2) AS avg_salary with GROUP BY department.',
    starterSql: 'SELECT department, ROUND(AVG(salary), 2) AS avg_salary FROM employees ...;',
    seedSql: `
      CREATE TABLE employees (id INTEGER PRIMARY KEY, department TEXT, salary REAL);
      INSERT INTO employees VALUES (1, 'Support', 45200.50), (2, 'Support', 48100.00), (3, 'Sales', 62300.00), (4, 'Sales', 71500.00);
    `,
    solutionSql: 'SELECT department, ROUND(AVG(salary), 2) AS avg_salary FROM employees GROUP BY department ORDER BY department;'
  },
  {
    id: 'int-5',
    level: 'intermediate',
    order: 15,
    title: '15. Subquery in WHERE (IN)',
    category: 'SUBQUERY',
    description: 'Find all books whose author is based in the "United Kingdom". Return book `title` and `author_id`. Order by `title`.',
    hint: 'WHERE author_id IN (SELECT id FROM authors WHERE country = \'United Kingdom\').',
    starterSql: 'SELECT title, author_id FROM books WHERE author_id IN (...);',
    seedSql: `
      CREATE TABLE authors (id INTEGER PRIMARY KEY, name TEXT, country TEXT);
      CREATE TABLE books (id INTEGER PRIMARY KEY, title TEXT, author_id INTEGER);
      INSERT INTO authors VALUES (1, 'George Orwell', 'United Kingdom'), (2, 'Mark Twain', 'United States'), (3, 'Jane Austen', 'United Kingdom');
      INSERT INTO books VALUES (10, '1984', 1), (11, 'Tom Sawyer', 2), (12, 'Pride and Prejudice', 3);
    `,
    solutionSql: "SELECT title, author_id FROM books WHERE author_id IN (SELECT id FROM authors WHERE country = 'United Kingdom') ORDER BY title;"
  },
  {
    id: 'int-6',
    level: 'intermediate',
    order: 16,
    title: '16. Scalar Subquery in SELECT',
    category: 'SUBQUERY',
    description: 'For every employee, select their `name`, `salary`, and the difference between their salary and the overall average company salary as `diff_from_avg` (rounded to 1 decimal place). Order by id.',
    hint: 'Use (salary - (SELECT AVG(salary) FROM employees)) in your SELECT clause.',
    starterSql: 'SELECT name, salary, ROUND(salary - (SELECT AVG(salary) FROM employees), 1) AS diff_from_avg FROM employees ORDER BY id;',
    seedSql: `
      CREATE TABLE employees (id INTEGER PRIMARY KEY, name TEXT, salary REAL);
      INSERT INTO employees VALUES (1, 'Ken', 80000), (2, 'Ryu', 100000), (3, 'Chun-Li', 120000);
    `,
    solutionSql: 'SELECT name, salary, ROUND(salary - (SELECT AVG(salary) FROM employees), 1) AS diff_from_avg FROM employees ORDER BY id;'
  },
  {
    id: 'int-7',
    level: 'intermediate',
    order: 17,
    title: '17. Conditional Logic with CASE WHEN',
    category: 'CASE',
    description: 'Categorize customers by credit score: score >= 750 is "Excellent", score >= 650 is "Good", otherwise "Needs Review". Return `name`, `score`, and `rating`. Order by score DESC.',
    hint: 'Use CASE WHEN score >= 750 THEN \'Excellent\' WHEN score >= 650 THEN \'Good\' ELSE \'Needs Review\' END AS rating.',
    starterSql: 'SELECT name, score, CASE WHEN ... END AS rating FROM customers ORDER BY score DESC;',
    seedSql: `
      CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT, score INTEGER);
      INSERT INTO customers VALUES (1, 'Sam', 780), (2, 'Alex', 660), (3, 'Jordan', 590), (4, 'Taylor', 720);
    `,
    solutionSql: "SELECT name, score, CASE WHEN score >= 750 THEN 'Excellent' WHEN score >= 650 THEN 'Good' ELSE 'Needs Review' END AS rating FROM customers ORDER BY score DESC;"
  },
  {
    id: 'int-8',
    level: 'intermediate',
    order: 18,
    title: '18. Insert New Records',
    category: 'DML',
    description: 'Insert a new department into the `departments` table with `id` = 4, `name` = "Security", and `budget` = 250000. Then return all rows from `departments` ordered by id.',
    hint: 'Run INSERT INTO departments VALUES (4, \'Security\', 250000); followed by SELECT * FROM departments ORDER BY id;',
    starterSql: "INSERT INTO departments (id, name, budget) VALUES (4, 'Security', 250000); SELECT * FROM departments ORDER BY id;",
    seedSql: `
      CREATE TABLE departments (id INTEGER PRIMARY KEY, name TEXT, budget INTEGER);
      INSERT INTO departments VALUES (1, 'IT', 400000), (2, 'Finance', 300000), (3, 'Ops', 200000);
    `,
    solutionSql: "INSERT INTO departments (id, name, budget) VALUES (4, 'Security', 250000); SELECT * FROM departments ORDER BY id;"
  },
  {
    id: 'int-9',
    level: 'intermediate',
    order: 19,
    title: '19. Update Records with Conditions',
    category: 'DML',
    description: 'Give all employees in the "Research" department a 10% raise (multiply salary by 1.1). Then return `name`, `department`, `salary` ordered by id.',
    hint: 'UPDATE employees SET salary = salary * 1.1 WHERE department = \'Research\'; then select all.',
    starterSql: "UPDATE employees SET salary = salary * 1.1 WHERE department = 'Research'; SELECT name, department, salary FROM employees ORDER BY id;",
    seedSql: `
      CREATE TABLE employees (id INTEGER PRIMARY KEY, name TEXT, department TEXT, salary REAL);
      INSERT INTO employees VALUES (1, 'Gordon', 'Research', 100000.0), (2, 'Barney', 'Security', 60000.0), (3, 'Alyx', 'Research', 90000.0);
    `,
    solutionSql: "UPDATE employees SET salary = salary * 1.1 WHERE department = 'Research'; SELECT name, department, salary FROM employees ORDER BY id;"
  },
  {
    id: 'int-10',
    level: 'intermediate',
    order: 20,
    title: '20. Delete with Specific Filter',
    category: 'DML',
    description: 'Delete all logs where `level` is "DEBUG". Then select all remaining logs ordered by id.',
    hint: 'DELETE FROM logs WHERE level = \'DEBUG\'; then SELECT * FROM logs ORDER BY id;',
    starterSql: "DELETE FROM logs WHERE level = 'DEBUG'; SELECT * FROM logs ORDER BY id;",
    seedSql: `
      CREATE TABLE logs (id INTEGER PRIMARY KEY, message TEXT, level TEXT);
      INSERT INTO logs VALUES (1, 'System started', 'INFO'), (2, 'Var x = 42', 'DEBUG'), (3, 'Disk full warning', 'WARN'), (4, 'Loop tick', 'DEBUG');
    `,
    solutionSql: "DELETE FROM logs WHERE level = 'DEBUG'; SELECT * FROM logs ORDER BY id;"
  },

  // ==========================================
  // LEVEL 3: ADVANCED (10 Challenges)
  // ==========================================
  {
    id: 'adv-1',
    level: 'advanced',
    order: 21,
    title: '21. Common Table Expression (CTE)',
    category: 'CTE',
    description: 'Write a CTE named `high_spenders` that selects `customer_id` and total spent (as `total`) for customers who spent more than 500. Then join it with `customers` to return `customers.name` and `total`. Order by total DESC.',
    hint: 'WITH high_spenders AS (SELECT customer_id, SUM(amount) AS total FROM orders GROUP BY customer_id HAVING SUM(amount) > 500) ...',
    starterSql: 'WITH high_spenders AS (...) SELECT customers.name, high_spenders.total FROM ...;',
    seedSql: `
      CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT);
      CREATE TABLE orders (id INTEGER PRIMARY KEY, customer_id INTEGER, amount REAL);
      INSERT INTO customers VALUES (1, 'Alice'), (2, 'Bob'), (3, 'Charlie');
      INSERT INTO orders VALUES (1, 1, 300), (2, 1, 350), (3, 2, 120), (4, 3, 700);
    `,
    solutionSql: 'WITH high_spenders AS (SELECT customer_id, SUM(amount) AS total FROM orders GROUP BY customer_id HAVING SUM(amount) > 500) SELECT customers.name, high_spenders.total FROM high_spenders JOIN customers ON high_spenders.customer_id = customers.id ORDER BY total DESC;'
  },
  {
    id: 'adv-2',
    level: 'advanced',
    order: 22,
    title: '22. Multiple Chained CTEs',
    category: 'CTE',
    description: 'Use two CTEs: `dept_totals` calculating `department` and total salary as `dept_total`, and `avg_dept` calculating the overall average of `dept_total`. Select all departments whose total salary is above that average.',
    hint: 'WITH dept_totals AS (...), avg_dept AS (...) SELECT * FROM dept_totals WHERE dept_total > (SELECT ...);',
    starterSql: 'WITH dept_totals AS (SELECT department, SUM(salary) AS dept_total FROM staff GROUP BY department), avg_dept AS (SELECT AVG(dept_total) AS threshold FROM dept_totals) SELECT department, dept_total FROM dept_totals WHERE dept_total > (SELECT threshold FROM avg_dept) ORDER BY department;',
    seedSql: `
      CREATE TABLE staff (id INTEGER PRIMARY KEY, department TEXT, salary REAL);
      INSERT INTO staff VALUES (1, 'Eng', 120000), (2, 'Eng', 130000), (3, 'Sales', 70000), (4, 'Ops', 50000), (5, 'Sales', 60000);
    `,
    solutionSql: 'WITH dept_totals AS (SELECT department, SUM(salary) AS dept_total FROM staff GROUP BY department), avg_dept AS (SELECT AVG(dept_total) AS threshold FROM dept_totals) SELECT department, dept_total FROM dept_totals WHERE dept_total > (SELECT threshold FROM avg_dept) ORDER BY department;'
  },
  {
    id: 'adv-3',
    level: 'advanced',
    order: 23,
    title: '23. Window Function: ROW_NUMBER',
    category: 'WINDOW',
    description: 'Assign a row number to each employee partitioned by `department` and ordered by `salary` descending. Return `department`, `name`, `salary`, and `row_num`. Order by department, row_num.',
    hint: 'ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC) AS row_num.',
    starterSql: 'SELECT department, name, salary, ROW_NUMBER() OVER (...) AS row_num FROM employees ORDER BY department, row_num;',
    seedSql: `
      CREATE TABLE employees (id INTEGER PRIMARY KEY, name TEXT, department TEXT, salary INTEGER);
      INSERT INTO employees VALUES (1, 'Ava', 'Finance', 92000), (2, 'Liam', 'Finance', 105000), (3, 'Mia', 'HR', 65000), (4, 'Noah', 'HR', 78000), (5, 'Zoe', 'Finance', 85000);
    `,
    solutionSql: 'SELECT department, name, salary, ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC) AS row_num FROM employees ORDER BY department, row_num;'
  },
  {
    id: 'adv-4',
    level: 'advanced',
    order: 24,
    title: '24. Window Function: DENSE_RANK',
    category: 'WINDOW',
    description: 'Rank students by `score` descending without gaps in rank numbers using DENSE_RANK(). Return `name`, `score`, and `rank`. Order by rank, name.',
    hint: 'DENSE_RANK() OVER (ORDER BY score DESC) AS rank.',
    starterSql: 'SELECT name, score, DENSE_RANK() OVER (ORDER BY score DESC) AS rank FROM students ORDER BY rank, name;',
    seedSql: `
      CREATE TABLE students (id INTEGER PRIMARY KEY, name TEXT, score INTEGER);
      INSERT INTO students VALUES (1, 'Harry', 95), (2, 'Hermione', 98), (3, 'Ron', 85), (4, 'Draco', 95), (5, 'Neville', 85);
    `,
    solutionSql: 'SELECT name, score, DENSE_RANK() OVER (ORDER BY score DESC) AS rank FROM students ORDER BY rank, name;'
  },
  {
    id: 'adv-5',
    level: 'advanced',
    order: 25,
    title: '25. Running Total with SUM() OVER',
    category: 'WINDOW',
    description: 'Calculate a cumulative running total of daily revenue as `running_total`. Return `sale_date`, `amount`, and `running_total`. Order by sale_date ASC.',
    hint: 'SUM(amount) OVER (ORDER BY sale_date ASC) AS running_total.',
    starterSql: 'SELECT sale_date, amount, SUM(amount) OVER (ORDER BY sale_date ASC) AS running_total FROM daily_sales ORDER BY sale_date ASC;',
    seedSql: `
      CREATE TABLE daily_sales (sale_date TEXT PRIMARY KEY, amount REAL);
      INSERT INTO daily_sales VALUES ('2026-10-01', 1200.00), ('2026-10-02', 1550.00), ('2026-10-03', 980.00), ('2026-10-04', 2100.00);
    `,
    solutionSql: 'SELECT sale_date, amount, SUM(amount) OVER (ORDER BY sale_date ASC) AS running_total FROM daily_sales ORDER BY sale_date ASC;'
  },
  {
    id: 'adv-6',
    level: 'advanced',
    order: 26,
    title: '26. Period Comparison with LAG()',
    category: 'WINDOW',
    description: 'Use the `LAG()` window function to retrieve the previous day\'s temperature as `prev_temp`. Return `day`, `temp`, `prev_temp`, and the temperature change (`temp - prev_temp`) as `temp_change`. Order by day ASC.',
    hint: 'LAG(temp, 1) OVER (ORDER BY day ASC) AS prev_temp.',
    starterSql: 'SELECT day, temp, LAG(temp, 1) OVER (ORDER BY day ASC) AS prev_temp, temp - LAG(temp, 1) OVER (ORDER BY day ASC) AS temp_change FROM weather ORDER BY day ASC;',
    seedSql: `
      CREATE TABLE weather (day INTEGER PRIMARY KEY, temp REAL);
      INSERT INTO weather VALUES (1, 68.0), (2, 72.5), (3, 71.0), (4, 75.0);
    `,
    solutionSql: 'SELECT day, temp, LAG(temp, 1) OVER (ORDER BY day ASC) AS prev_temp, temp - LAG(temp, 1) OVER (ORDER BY day ASC) AS temp_change FROM weather ORDER BY day ASC;'
  },
  {
    id: 'adv-7',
    level: 'advanced',
    order: 27,
    title: '27. Correlated Subquery with EXISTS',
    category: 'SUBQUERY',
    description: 'Find all suppliers who supply at least one product that has `stock` equal to 0. Return supplier `id` and `name`. Order by id.',
    hint: 'WHERE EXISTS (SELECT 1 FROM products WHERE products.supplier_id = suppliers.id AND stock = 0).',
    starterSql: 'SELECT id, name FROM suppliers WHERE EXISTS (...);',
    seedSql: `
      CREATE TABLE suppliers (id INTEGER PRIMARY KEY, name TEXT);
      CREATE TABLE products (id INTEGER PRIMARY KEY, supplier_id INTEGER, title TEXT, stock INTEGER);
      INSERT INTO suppliers VALUES (1, 'Acme Corp'), (2, 'Globex'), (3, 'Initech');
      INSERT INTO products VALUES (10, 1, 'Anvil', 5), (11, 2, 'Widget', 0), (12, 3, 'Stapler', 12);
    `,
    solutionSql: 'SELECT id, name FROM suppliers WHERE EXISTS (SELECT 1 FROM products WHERE products.supplier_id = suppliers.id AND stock = 0) ORDER BY id;'
  },
  {
    id: 'adv-8',
    level: 'advanced',
    order: 28,
    title: '28. Self Join on Hierarchical Data',
    category: 'JOIN',
    description: 'Each employee in `staff` has a `manager_id` referencing another employee\'s `id`. Return `employee` (staff.name) and their `manager` (manager.name). Exclude top-level employees who have no manager. Order by employee.',
    hint: 'FROM staff JOIN staff AS manager ON staff.manager_id = manager.id.',
    starterSql: 'SELECT s.name AS employee, m.name AS manager FROM staff s JOIN staff m ON s.manager_id = m.id ORDER BY employee;',
    seedSql: `
      CREATE TABLE staff (id INTEGER PRIMARY KEY, name TEXT, manager_id INTEGER);
      INSERT INTO staff VALUES (1, 'Chief Executive', NULL), (2, 'VP Tech', 1), (3, 'VP Sales', 1), (4, 'Lead Dev', 2), (5, 'Account Exec', 3);
    `,
    solutionSql: 'SELECT s.name AS employee, m.name AS manager FROM staff s JOIN staff m ON s.manager_id = m.id ORDER BY employee;'
  },
  {
    id: 'adv-9',
    level: 'advanced',
    order: 29,
    title: '29. String Parsing with SUBSTR & INSTR',
    category: 'STRING',
    description: 'Extract the username (characters before the \'@\' symbol) from the `email` column in the `contacts` table as `handle`. Return `id`, `email`, and `handle`. Order by id.',
    hint: 'Use SUBSTR(email, 1, INSTR(email, \'@\') - 1) AS handle.',
    starterSql: "SELECT id, email, SUBSTR(email, 1, INSTR(email, '@') - 1) AS handle FROM contacts ORDER BY id;",
    seedSql: `
      CREATE TABLE contacts (id INTEGER PRIMARY KEY, email TEXT);
      INSERT INTO contacts VALUES (1, 'johndoe@example.com'), (2, 'ada.lovelace@computing.org'), (3, 'turing@ai.edu');
    `,
    solutionSql: "SELECT id, email, SUBSTR(email, 1, INSTR(email, '@') - 1) AS handle FROM contacts ORDER BY id;"
  },
  {
    id: 'adv-10',
    level: 'advanced',
    order: 30,
    title: '30. Financial Reconciliation with CTE & Joins',
    category: 'RECONCILIATION',
    description: 'Reconcile account balances: Compare each account\'s declared `opening_balance` + total deposits - total withdrawals against the declared `closing_balance`. Return `account_id`, `calculated_balance`, `closing_balance`, and `is_reconciled` (1 if calculated_balance = closing_balance, else 0). Order by account_id.',
    hint: 'Use COALESCE(SUM(amount), 0) for deposits and withdrawals, or a CASE statement.',
    starterSql: `WITH movements AS (
  SELECT account_id,
    COALESCE(SUM(CASE WHEN type = 'deposit' THEN amount ELSE 0 END), 0) AS total_dep,
    COALESCE(SUM(CASE WHEN type = 'withdrawal' THEN amount ELSE 0 END), 0) AS total_wdr
  FROM transactions GROUP BY account_id
)
SELECT a.id AS account_id,
  (a.opening_balance + m.total_dep - m.total_wdr) AS calculated_balance,
  a.closing_balance,
  CASE WHEN (a.opening_balance + m.total_dep - m.total_wdr) = a.closing_balance THEN 1 ELSE 0 END AS is_reconciled
FROM accounts a
JOIN movements m ON a.id = m.account_id
ORDER BY a.id;`,
    seedSql: `
      CREATE TABLE accounts (id INTEGER PRIMARY KEY, opening_balance REAL, closing_balance REAL);
      CREATE TABLE transactions (id INTEGER PRIMARY KEY, account_id INTEGER, type TEXT, amount REAL);
      INSERT INTO accounts VALUES (101, 1000.0, 1450.0), (102, 500.0, 300.0);
      INSERT INTO transactions VALUES (1, 101, 'deposit', 500.0), (2, 101, 'withdrawal', 50.0), (3, 102, 'withdrawal', 200.0);
    `,
    solutionSql: `WITH movements AS (
  SELECT account_id,
    COALESCE(SUM(CASE WHEN type = 'deposit' THEN amount ELSE 0 END), 0) AS total_dep,
    COALESCE(SUM(CASE WHEN type = 'withdrawal' THEN amount ELSE 0 END), 0) AS total_wdr
  FROM transactions GROUP BY account_id
)
SELECT a.id AS account_id,
  (a.opening_balance + m.total_dep - m.total_wdr) AS calculated_balance,
  a.closing_balance,
  CASE WHEN (a.opening_balance + m.total_dep - m.total_wdr) = a.closing_balance THEN 1 ELSE 0 END AS is_reconciled
FROM accounts a
JOIN movements m ON a.id = m.account_id
ORDER BY a.id;`
  }
];
