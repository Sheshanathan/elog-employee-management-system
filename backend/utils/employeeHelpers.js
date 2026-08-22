const EMPLOYEE_POPULATES = [
    { path: "department", select: "name status" },
    { path: "designation", select: "name status" }
];

const EMPLOYEE_NESTED_POPULATE = {
    path: "employee",
    select: "employeeId name department designation status joiningDate email phone",
    populate: EMPLOYEE_POPULATES
};

const USER_ACCOUNT_POPULATE = {
    select: "name email role employee",
    populate: {
        path: "employee",
        select: "name employeeId"
    }
};

module.exports = {
    EMPLOYEE_POPULATES,
    EMPLOYEE_NESTED_POPULATE,
    USER_ACCOUNT_POPULATE
};
