var inq = require("inquirer");
var mysql = require("mysql");
var conTab = require("console.table");

var connection = mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "",
    database: "company_db"
});

function missionSelect() {
    inq.prompt({
        type: "rawlist",
        name: "stage",
        message: "Welcome to the CompanyName archive, what would you like to do?",
        choices: ["Add to archive", "View archived information", "Update employee roles", "Remove company asset"]
    }).then(reason => {
        if (reason.stage === "Add to archive") {
            addition();
        }
        else if (reason.stage === "View archived information") {
            display();
        }
        else if (reason.stage === "Update employee roles") {
            update();
        }
        else {
            subtract();
        }
    });
}

missionSelect();

function addition() {
    inq.prompt({
        type: "list",
        name: "table",
        message: "Create a new:",
        choices: ["department", "role", "employee"]
    }).then(datum => {
        if (datum.table === "department") {
            var newDep;
            inq.prompt({
                type: "input",
                name: "name",
                message: "Name of the new department?"
            }).then(info => {
                newDep = info.name;
            })
            // rewrite this to connect.query inside the .then, will save space later
            connection.query("INSERT INTO department SET ?", {
                name: newDep
            }, (err, res) => {
                if (err) throw err;
                console.log(`New department "${depName}" created.`)
                missionSelect();
            })
        }
        else if (datum.table === "role") {
            inq.prompt([{
                type: "input",
                name: "pos",
                message: "Name of the new position:"
            },
            {
                type: "number",
                name: "sal",
                message: "Base salary:"
            },
            {
                type: "number",
                name: "dep",
                message: "ID of department:"
            }]).then(info => {
                connection.query("INSERT INTO role SET ?", {
                    position: info.pos,
                    salary: info.sal,
                    department_id: info.dep
                }, (err, res) => {
                    if (err) throw err;
                    console.log(`new position "${info.pos}" created.`);
                    missionSelect();
                });
            });
        }
        else if (datum.table === "employee") {
            inq.prompt([{
                type: "input",
                name: "F",
                message: "Employee's first name:"
            },
            {
                type: "input",
                name: "L",
                message: "Employee's last name:"
            }, {
                type: "number",
                name: "job",
                message: "Employee's role ID:"
            }, {
                type: "number",
                name: "boss",
                message: "Employee's manager's ID:"
            }]).then(data => {
                connection.query("INSERT INTO employees SET ?",
                    {
                        first_name: data.F,
                        last_name: data.L,
                        role_id: data.job,
                        manager_id: data.boss,
                    }, (err, res) => {
                        if (err) throw err;
                        console.log(`New employee record "${data.F} ${data.L}" created`);
                        missionSelect();
                    })
            })
        }
    });

}

function display() {
    inq.prompt({
        type: "rawlist",
        name: "show",
        message: "What would you like to see?",
        choices: ["Employee records", "Departments", "Roles"]
    }).then(info => {
        if (info.show === "Employee records") {
            var query = "SELECT employees.id, employees.first_name, employees.last_name, role.position, role.salary ";
            query += "FROM employees INNER JOIN role ON (employees.role_id = role.id)";
            connection.query(query, (err, res) => {
                if (err) throw err;
                console.table(res);
            });
            missionSelect();
        }
        else if (info.show === "Departments") {
            connection.query("SELECT * FROM department", (err, res) => {
                if (err) throw err;
                console.table(res);
                missionSelect();
            });
        }
        else if (info.show === "Roles") {
            var query = "SELECT role.position, department.department FROM role ";
            query += "INNER JOIN department ON (department.id = role.department_id)";
            connection.query(query, (err, res) => {
                if (err) throw err;
                console.table(res);
                missionSelect();
            });
        }
    })
}

function update() {
    var query = "SELECT employees.first_name, employees.last_name, role.position ";
    query += "FROM employees INNER JOIN role ON (employees.role_id = role.id)";
    connection.query(query, (err, res) => {
        if (err) throw err;
        var emps = [];
        res.forEach(person => {
            emps.push(`${person.first_name} ${person.last_name}, ${person.position}`);
        });
        inq.prompt([{
            type: "rawlist",
            name: "empUp",
            message: "Which employee would you like to change?",
            choices: emps
        },
        {
            type: "number",
            name: "newJob",
            message: "ID of new position?",
        }]).then(info => {
            let emp = info.empUp.trim().split(" ");
            connection.query(`UPDATE employees SET role_id = ${info.newJob} WHERE employees.first_name = ${emp[0]} AND employees.last_name = ${emp[1]}`, (err, res) => {
                if (err) throw err;
                console.log("Record updated.");
                missionSelect();
            });
        });
    });
}

function subtract() {
    inq.prompt({
        type: "list",
        name: "rem",
        message: "What kind of record would you like to purge?",
        choices: ["Employee", "Department", "Role"]
    }).then(yeet => {
        if (yeet.rem === "Employee") {
            var query = "SELECT employees.first_name, employees.last_name, role.position ";
            query += "FROM employees INNER JOIN role ON (employees.role_id = role.id)";
            connection.query(query, (err, res) => {
                if (err) throw err;
                var emps = [];
                res.forEach(person => {
                    emps.push(`${person.first_name} ${person.last_name}, ${person.position}`);
                });
                inq.prompt({
                    type: "list",
                    name: "name",
                    message: "Who's fired?",
                    choices: emps
                }).then(yote => {
                    let person = yote.name.trim().split(" ");
                    connection.query(`DELETE FROM employees WHERE first_name = ${person[0]} AND last_name = ${person[1]}`, (err, res) => {
                        if (err) throw err;
                        console.log(`${yote.name} has LEFT THE BUILDING`);
                        missionSelect();
                    })
                })
            })
        }
        else if (yeet.rem === "Department") {
            connection.query("SELECT * FROM department", (err, res)=>{
                if (err) throw err;
                let deps = [];
                res.forEach(item=>{
                    deps.push(item.department);
                });
                inq.prompt({
                    type:"list",
                    name:"dep",
                    message:"Which department is being 'restructured'?",
                    choices: deps
                }).then(info=>{
                    connection.query(`DELETE FROM department WHERE department = ${info.dep}`, (err, res)=>{
                        if (err) throw err;
                        console.log(`Department "${info.dep}" dissolved.`);
                        missionSelect();
                    })
                })
            })
        }
        else if (yeet.rem === "Role") {
            console.log("PLEASE MAKE SURE TO REPLACE THIS ID WITH A NEW ROLE AND/OR REASSIGN ALL EMPLOYEES FIRST!");
            connection.query("SELECT position FROM role", (err, res)=>{
                if (err) throw err;
                let jobs = [];
                res.forEach(item=>{
                    jobs.push(item.position);
                });
                inq.prompt({
                    type: "list",
                    name: "jorb",
                    message: "What position no longer exists at this company?",
                    choices: jobs
                }).then(info=>{
                    connection.query(`DELETE FROM role WHERE position = ${info.jorb}`, (err, res)=>{
                        if (err) throw err;
                        console.log("role removed.");
                        missionSelect();
                    })
                })
            })
        }
    })
}

