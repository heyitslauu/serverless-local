import { APIGatewayProxyHandler } from "aws-lambda";

import { allotmentService } from "../../services/allotmentService";

const { downloadAllotment } = allotmentService();

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const body = JSON.parse(event.body || "{}");
    const newAllotment = await downloadAllotment(body);
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Allotment created",
        allotment: newAllotment,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error creating Allotment",
        error: error.message,
      }),
    };
  }
};
