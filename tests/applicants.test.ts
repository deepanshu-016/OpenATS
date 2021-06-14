import { createRequest, createResponse, RequestMethod } from "node-mocks-http";
import { NextApiRequest, NextApiResponse } from "next";
import * as Config from "../config/GeneralConfig";
import applicants from "../pages/api/applicants/index";
import axios from "axios";
import { APPLICANT_ID_LENGTH } from "../config/GeneralConfig";
const localUrl = "http://localhost:3000";
const applicantsAPIRoute = "/api/applicants";
jest.setTimeout(30000); // Causing issues in Github action

describe(applicantsAPIRoute, () => {
  test("Creates an applicant with the specified info", async () => {
    const body = {
      name: "Jose Valerio",
      funnel: "Developer",
    };
    const response = await axios.post(localUrl + applicantsAPIRoute, body);

    expect(response.status).toBe(201);
    expect(response.data).toEqual({
      message: "Applicant succesfully created!",
      applicant: {
        PK: expect.any(String),
        SK: expect.any(String),
        id: expect.any(String),
        name: expect.stringMatching(body.name),
        funnel: expect.stringMatching(body.funnel),
        created_at: expect.any(String),
        type: expect.stringMatching("APPLICANT"),
      },
    });
  });

  test("Gets all applicants", async () => {
    const response = await axios.get(localUrl + applicantsAPIRoute);
    expect(response.status).toBe(200);
    expect(response.data).toEqual({
      applicants: expect.any(Array), // Array of applicants
    });
  });
});
