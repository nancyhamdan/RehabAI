import pandas as pd
import os
import numpy as np
import math


def get_joint_pair(df, joint_name):
  return [df[f"{joint_name}_x"], df[f"{joint_name}_y"]]


def calculate_angle(first, middle, end):
    first = np.array(first)
    middle = np.array(middle)
    end = np.array(end)

    radians = np.arctan2(end[1]-middle[1], end[0]-middle[0]) - np.arctan2(first[1]-middle[1], first[0]-middle[0])
    angle = np.abs(radians*180.0/np.pi)

    angles = [360-a if a > 180 else a for a in angle]
    return angles


def calculate_distance(pair1, pair2):
  pair1_x, pair1_y = pair1
  pair2_x, pair2_y = pair2
  return pd.Series([math.dist([x1, y1], [x2, y2]) for x1, y1, x2, y2 in zip(pair1_x, pair1_y, pair2_x, pair2_y)])


def get_es1_features(df):
  features_df = pd.DataFrame()

  features_df["left_arm_torso_angle"] = calculate_angle(get_joint_pair(df, "left_elbow"),
                                                   get_joint_pair(df, "left_shoulder"),
                                                   get_joint_pair(df, "left_hip"))

  features_df["right_arm_torso_angle"] = calculate_angle(get_joint_pair(df, "right_elbow"),
                                                   get_joint_pair(df, "right_shoulder"),
                                                   get_joint_pair(df, "right_hip"))

  features_df["left_elbow_extension_angle"] = calculate_angle(get_joint_pair(df, "left_shoulder"),
                                                     get_joint_pair(df, "left_elbow"),
                                                     get_joint_pair(df, "left_wrist"))

  features_df["right_elbow_extension_angle"] = calculate_angle(get_joint_pair(df, "right_shoulder"),
                                                     get_joint_pair(df, "right_elbow"),
                                                     get_joint_pair(df, "right_wrist"))

  features_df["left_knee_extension_angle"] = calculate_angle(get_joint_pair(df, "left_hip"),
                                                    get_joint_pair(df, "left_knee"),
                                                    get_joint_pair(df, "left_ankle"))

  features_df["right_knee_extension_angle"] = calculate_angle(get_joint_pair(df, "right_hip"),
                                                    get_joint_pair(df, "right_knee"),
                                                    get_joint_pair(df, "right_ankle"))

  mid_hip_point = [(get_joint_pair(df, "left_hip")[0] + get_joint_pair(df, "right_hip")[0])/2, (get_joint_pair(df, "left_hip")[1] + get_joint_pair(df, "right_hip")[1])/2]
  features_df["hip_angle"] = calculate_angle(get_joint_pair(df, "left_hip"),
                                        mid_hip_point,
                                        get_joint_pair(df, "right_hip"))

  features_df["hands_dist"] = calculate_distance(get_joint_pair(df, "left_wrist"), get_joint_pair(df, "right_wrist"))

  features_df["ankle_dist"] = calculate_distance(get_joint_pair(df, "left_ankle"), get_joint_pair(df, "right_ankle"))

  return features_df