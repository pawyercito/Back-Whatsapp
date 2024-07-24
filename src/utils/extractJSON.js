import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const extractJSON = ({ path }) => {
  try {
    return require(path);
  } catch (error) {
    console.log(`Hubo un error al importar json ${error.message}`);
    return false;
  }
};

export default extractJSON;
