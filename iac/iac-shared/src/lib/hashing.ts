import { BinaryLike, createHash, randomFillSync } from "crypto";
import { createReadStream } from "fs";
import { folderFileList } from "./utils";

/***
 * Return hex digest md5 of input.
 * @param input
 */
export const md5 = (input: BinaryLike) =>
  createHash("md5").update(input).digest("hex");

/***
 * Return hex digest sha1 of input.
 * @param input
 */
export const sha1 = (input: BinaryLike) =>
  createHash("sha1").update(input).digest("hex");

/***
 * Return hash file specified by path using algorithm.
 * @param path Path to file to hash
 * @param algorithm Algorithm to use for hashing. Defaults to sha1
 */
export const hashFileOld = (path: string, algorithm: string = "sha1") =>
  new Promise<string>((resolve, reject) => {
    const hash = createHash(algorithm);
    const rs = createReadStream(path);
    rs.once("error", reject);
    rs.on("data", (chunk) => hash.update(chunk));
    rs.once("end", () => resolve(hash.digest("hex")));
  });

/***
 * Return hash file specified by path using algorithm.
 * @param path Path to file to hash
 * @param algorithm Algorithm to use for hashing. Defaults to sha1
 */
export const hashFile = (path: string, algorithm: string = "sha1") =>
  new Promise<string>((resolve, reject) => {
    const hash = createHash(algorithm);
    hash.setEncoding("hex");
    const rs = createReadStream(path);
    rs.once("error", reject);
    rs.once("end", () => {
      hash.end();
      resolve(hash.read());
    });
    rs.pipe(hash);
  });

/***
 * Return hex encoded md5 hash for file.
 * @param path Path to file to hash
 */
export const md5File = (path: string): Promise<string> => hashFile(path, "md5");

/***
 * Return hex encoded sha1 hash for file.
 * @param path Path to file to hash
 */
export const sha1File = (path: string): Promise<string> =>
  hashFile(path, "sha1");

/***
 * Hash all files in fileList using algorithm then return single hash created from all file hashes.
 * @param fileList Array of path strings to files to be hashed
 * @param algorithm Algorithm to use for hashing. Defaults to sha1
 * @param sorted Set to true if fileList is already sorted otherwise hashFiles will sort it before use
 */
export const hashFiles = async (
  fileList: string[],
  algorithm: string = "sha1",
  sorted: boolean = false
): Promise<string> => {
  if (!sorted) {
    fileList.sort();
  }
  // console.dir(fileList);
  const hash = createHash(algorithm);
  for (const file of fileList) {
    const hf = await hashFile(file, algorithm);
    hash.update(hf);
  }
  return hash.digest("hex");
};

/***
 * Generate a single hex encoded hash for all files in dir.
 * If neither includePattern or excludePattern as specified then all files are hashed.
 * @param dir
 * @param recursive Should search be recursive. Defaults to true
 * @param includePattern If provided only files matching RegExp will be returned
 * @param excludePattern If provided files matching RegExp will be omitted
 * @param algorithm Hashing algorithm to use. Defaults to sha1
 */
export const hashFolder = (
  dir: string,
  recursive: boolean = true,
  includePattern: RegExp | null = null,
  excludePattern: RegExp | null = null,
  algorithm: string = "sha1"
): Promise<string> =>
  hashFiles(
    folderFileList(dir, recursive, false, includePattern, excludePattern),
    algorithm
  );

/***
 * Generate a uuid just as random as uuid package but twice as fast
 * @param t Number of chars to generate. Defaults to 21
 */
export const nanoid = (t: number = 21): string => {
  const r = randomFillSync(new Uint8Array(t));
  let e = "";
  let n: number;
  while (t--) {
    n = 63 & r[t];
    e +=
      n < 36
        ? n.toString(36)
        : n < 62
        ? (n - 26).toString(36).toUpperCase()
        : n < 63
        ? "_"
        : "-";
  }
  return e;
};
