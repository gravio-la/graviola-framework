import { printCreationTree, runPersonMappingDemo } from "./mapPersonDemo";

const documents = await runPersonMappingDemo();
printCreationTree(documents);
