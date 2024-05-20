import React, {useEffect, useState} from 'react';

// Sample interaction data
const data = [
  {user_id: 1, post_id: 101, like: 1, comment: 1, share: 0, view: 1},
  {user_id: 2, post_id: 102, like: 0, comment: 0, share: 1, view: 1},
  {user_id: 1, post_id: 103, like: 1, comment: 0, share: 0, view: 1},
  {user_id: 3, post_id: 101, like: 0, comment: 1, share: 0, view: 1},
  {user_id: 2, post_id: 104, like: 0, comment: 0, share: 1, view: 1},
  {user_id: 4, post_id: 102, like: 1, comment: 0, share: 0, view: 1},
  {user_id: 3, post_id: 105, like: 0, comment: 1, share: 0, view: 1},
  {user_id: 1, post_id: 106, like: 0, comment: 0, share: 0, view: 1},
];

const cosineSimilarity = (vec1: any, vec2: any) => {
  let dotProduct = 0;
  let magnitude1 = 0;
  let magnitude2 = 0;
  for (const key in vec1) {
    if (vec1.hasOwnProperty(key) && vec2.hasOwnProperty(key)) {
      dotProduct += vec1[key] * vec2[key];
      magnitude1 += vec1[key] ** 2;
      magnitude2 += vec2[key] ** 2;
    }
  }
  magnitude1 = Math.sqrt(magnitude1);
  magnitude2 = Math.sqrt(magnitude2);
  return dotProduct / (magnitude1 * magnitude2);
};

const InteractionMatrix = () => {
  const [interactionMatrix, setInteractionMatrix] = useState<any>({});
  const [userSimilarity, setUserSimilarity] = useState<any>({});

  useEffect(() => {
    // Create DataFrame
    const df = new Map();
    data.forEach(item => {
      const key = item.user_id;
      if (!df.has(key)) {
        df.set(key, {});
      }
      df.get(key)[item.post_id] = {
        like: item.like,
        comment: item.comment,
        share: item.share,
        view: item.view,
      };
    });

    // Convert to DataFrame
    const interactionMatrixObj: any = {};
    for (const [userId, interactions] of df) {
      interactionMatrixObj[userId] = interactions;
    }
    setInteractionMatrix(interactionMatrixObj);

    // Compute similarity between users
    const userSimilarityObj: any = {};
    Object.keys(interactionMatrixObj).forEach(userId1 => {
      userSimilarityObj[userId1] = {};
      Object.keys(interactionMatrixObj).forEach(userId2 => {
        if (userId1 !== userId2) {
          const similarity = cosineSimilarity(
            interactionMatrixObj[userId1],
            interactionMatrixObj[userId2],
          );
          userSimilarityObj[userId1][userId2] = similarity;
        }
      });
    });
    setUserSimilarity(userSimilarityObj);
  }, []);

  const recommendPosts = (userId: number, numRecommendations: number = 5) => {
    const similarUsers = Object.keys(userSimilarity[userId]).sort(
      (a, b) => userSimilarity[userId][b] - userSimilarity[userId][a],
    );
    const userInteractions = interactionMatrix[userId];
    const alreadyInteractedPosts = Object.keys(userInteractions).filter(
      postId => userInteractions[postId].view > 0,
    );
    const meanInteractions: any = {};
    similarUsers.forEach(similarUser => {
      Object.keys(interactionMatrix[similarUser]).forEach(postId => {
        if (!meanInteractions[postId]) {
          meanInteractions[postId] = 0;
        }
        meanInteractions[postId] += interactionMatrix[similarUser][postId].view;
      });
    });
    const recommendations = Object.keys(meanInteractions)
      .filter(postId => !alreadyInteractedPosts.includes(postId))
      .sort((a, b) => meanInteractions[b] - meanInteractions[a])
      .slice(0, numRecommendations);
    return recommendations;
  };

  return null;
};

export default InteractionMatrix;
export {recommendPosts};
