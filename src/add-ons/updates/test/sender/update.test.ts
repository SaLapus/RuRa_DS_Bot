import env from "dotenv";
env.config();

import { getUpdate } from "../../modules/api/api";
import UpdatesClient from "../../modules/sender/update";

console.log = () => {
  return;
};

const TestUpdateClient = async (title: UpdatesClient, date: Date) => {
  expect(title).toBeInstanceOf(UpdatesClient);
  expect(title.info).toEqual({ projectID: 34, volumeID: 473 });
  expect(title.lastUpdateDate).toEqual(date);

  const titleUpdate = await title.createUpdate();
  expect(titleUpdate).toEqual(
    expect.objectContaining({
      meta: expect.objectContaining({
        projectID: expect.any(Number),
        volumeID: expect.any(Number),
      }),

      title: expect.any(String),
      annotation: expect.any(String),
      doneStatus: expect.any(Boolean),
      description: expect.any(String),
      updateURL: expect.any(String),
      coverURL: expect.any(String),

      staff: expect.anything(),

      chapters: expect.arrayContaining([
        expect.objectContaining({
          title: expect.any(String),
          id: expect.any(Number),
          volumeId: expect.any(Number),
          publishDate: expect.any(String),

          childs: expect.anything(),
        }),
      ]),
    })
  );

  const cover = await titleUpdate.getCover();
  expect(cover).toBeInstanceOf(Buffer);
};

describe("UpdateClient Test", () => {
  test("Normal update", async () => {
    expect.assertions(5);

    const update = await getUpdate(1);
    const date = new Date(update.showTime);
    date.setHours(-24);

    const title = new UpdatesClient(update, date);
    await TestUpdateClient(title, date);
  });

  test("Undefined Update", async () => {
    const date = new Date();
    date.setHours(-24);

    try {
      new UpdatesClient(
        undefined as unknown as {
          projectId: number;
          volumeId: number;
        },
        date
      );
    } catch (e) {
      expect(e).toBeInstanceOf(Error);
    }
  });

  test("Undefined Date", async () => {
    const update = await getUpdate(1);

    try {
      new UpdatesClient(update, undefined as unknown as Date);
    } catch (e) {
      expect(e).toBeInstanceOf(Error);
    }
  });
});
