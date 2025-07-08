import { APIGatewayProxyHandler } from "aws-lambda";

import { officeService } from "../../services/officeService";

const { getOffices } = officeService();

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const offices = await getOffices();
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Successfully retrieved all Offices.",
        data: offices,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error retrieving Offices",
        error: error.message,
      }),
    };
  }
};
