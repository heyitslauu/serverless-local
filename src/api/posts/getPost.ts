import { APIGatewayProxyHandler } from "aws-lambda";
import { getPost } from "../../services/postService";

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const postId = event.pathParameters?.postId;
    if (!postId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing postId in path parameters." }),
      };
    }

    const post = await getPost(postId);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Post retrieved", post }),
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Failed to retrieve post",
        error: error.message,
      }),
    };
  }
};
