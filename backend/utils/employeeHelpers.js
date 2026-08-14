const EMPLOYEE_POPULATES = [
    { path: "department", select: "name status" },
    { path: "designation", select: "name status" }
];

const EMPLOYEE_NESTED_POPULATE = {
    path: "employee",
    select: "employeeId name department designation status joiningDate email phone",
    populate: EMPLOYEE_POPULATES
};

module.exports = {
    EMPLOYEE_POPULATES,
    EMPLOYEE_NESTED_POPULATE
};
