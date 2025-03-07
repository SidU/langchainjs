import { test, expect } from "@jest/globals";
import fs from "fs/promises";
import path from "path";
import os from "os";

import { HNSWLib } from "../hnswlib";
import { OpenAIEmbeddings } from "../../embeddings";
import { Document } from "../../document";

test("Test HNSWLib.fromTexts", async () => {
  const vectorStore = await HNSWLib.fromTexts(
    ["Hello world", "Bye bye", "hello nice world"],
    [{ id: 2 }, { id: 1 }, { id: 3 }],
    new OpenAIEmbeddings()
  );
  expect(vectorStore.index?.getCurrentCount()).toBe(3);

  const resultOne = await vectorStore.similaritySearch("hello world", 1);
  const resultOneMetadatas = resultOne.map(({ metadata }) => metadata);
  expect(resultOneMetadatas).toEqual([{ id: 2 }]);

  const resultTwo = await vectorStore.similaritySearch("hello world", 3);
  const resultTwoMetadatas = resultTwo.map(({ metadata }) => metadata);
  expect(resultTwoMetadatas).toEqual([{ id: 2 }, { id: 3 }, { id: 1 }]);
});

test("Test HNSWLib.fromTexts + addDocuments", async () => {
  const vectorStore = await HNSWLib.fromTexts(
    ["Hello world", "Bye bye", "hello nice world"],
    [{ id: 2 }, { id: 1 }, { id: 3 }],
    new OpenAIEmbeddings()
  );
  expect(vectorStore.index?.getMaxElements()).toBe(3);
  expect(vectorStore.index?.getCurrentCount()).toBe(3);

  await vectorStore.addDocuments([
    new Document({
      pageContent: "hello worldklmslksmn",
      metadata: { id: 4 },
    }),
  ]);
  expect(vectorStore.index?.getMaxElements()).toBe(4);

  const resultTwo = await vectorStore.similaritySearch("hello world", 3);
  const resultTwoMetadatas = resultTwo.map(({ metadata }) => metadata);
  expect(resultTwoMetadatas).toEqual([{ id: 2 }, { id: 3 }, { id: 4 }]);
});

test("Test HNSWLib.load and HNSWLib.save", async () => {
  const vectorStore = await HNSWLib.fromTexts(
    ["Hello world", "Bye bye", "hello nice world"],
    [{ id: 2 }, { id: 1 }, { id: 3 }],
    new OpenAIEmbeddings()
  );
  expect(vectorStore.index?.getCurrentCount()).toBe(3);

  const resultOne = await vectorStore.similaritySearch("hello world", 1);
  const resultOneMetadatas = resultOne.map(({ metadata }) => metadata);
  expect(resultOneMetadatas).toEqual([{ id: 2 }]);

  const resultTwo = await vectorStore.similaritySearch("hello world", 3);
  const resultTwoMetadatas = resultTwo.map(({ metadata }) => metadata);
  expect(resultTwoMetadatas).toEqual([{ id: 2 }, { id: 3 }, { id: 1 }]);

  const tempDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "lcjs-"));

  console.log(tempDirectory);

  await vectorStore.save(tempDirectory);

  const loadedVectorStore = await HNSWLib.load(
    tempDirectory,
    new OpenAIEmbeddings()
  );

  const resultThree = await loadedVectorStore.similaritySearch(
    "hello world",
    1
  );

  const resultThreeMetadatas = resultThree.map(({ metadata }) => metadata);
  expect(resultThreeMetadatas).toEqual([{ id: 2 }]);

  const resultFour = await loadedVectorStore.similaritySearch("hello world", 3);

  const resultFourMetadatas = resultFour.map(({ metadata }) => metadata);
  expect(resultFourMetadatas).toEqual([{ id: 2 }, { id: 3 }, { id: 1 }]);
});
