import { APIGatewayProxyHandler } from "aws-lambda";
import { getAllPosts } from "../../services/postService";

export const handler: APIGatewayProxyHandler = async () => {
  try {
    const posts = await getAllPosts();

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Successfully retrieved all posts.",
        posts,
      }),
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Failed to retrieve posts.",
        error: error.message,
      }),
    };
  }
};
