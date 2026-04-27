export const ROBOT_CATALOG = [
  {
    id: "repairBot",
    name: "Repair Bot",
    abilities: ["repair"],
    habitat: "outpost"
  }
];

export function getRobotById(id) {
  return ROBOT_CATALOG.find((robot) => robot.id === id) ?? null;
}