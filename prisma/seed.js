const stageKinds = [
  { name: "Lead", kind: "LEAD", position: 0 },
  { name: "Qualified", kind: "QUALIFIED", position: 1 },
  { name: "Proposal", kind: "PROPOSAL", position: 2 },
  { name: "Negotiation", kind: "NEGOTIATION", position: 3 },
  { name: "Won", kind: "WON", position: 4 },
  { name: "Lost", kind: "LOST", position: 5 },
];

async function main() {
  console.log("Seed placeholder for default workspace and pipeline.");
  console.log(
    "Create one default workspace, admin user, and pipeline with stages:",
    stageKinds.map((stage) => stage.name).join(", "),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
