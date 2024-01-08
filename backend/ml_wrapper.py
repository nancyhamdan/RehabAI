import pandas as pd
import numpy as np


def get_dataframe_cols():
    KEYPOINT_DICT = {
        "nose": 0,
        "left_eye": 1,
        "right_eye": 2,
        "left_ear": 3,
        "right_ear": 4,
        "left_shoulder": 5,
        "right_shoulder": 6,
        "left_elbow": 7,
        "right_elbow": 8,
        "left_wrist": 9,
        "right_wrist": 10,
        "left_hip": 11,
        "right_hip": 12,
        "left_knee": 13,
        "right_knee": 14,
        "left_ankle": 15,
        "right_ankle": 16,
    }
    df_cols = []
    for keypoint_name in KEYPOINT_DICT:
        df_cols.append(f"{keypoint_name}_y")
        df_cols.append(f"{keypoint_name}_x")
        df_cols.append(f"{keypoint_name}_confidence")
    return df_cols


all_cols = get_dataframe_cols()
cols_drop = all_cols[:15]


def prepare_data(df, max_length):
    df = df.head(600)
    data = []
    padding_masks = []
    live_video_frames = df.shape[0]
    joint_positions_data = df.drop(cols_drop, axis=1)
    joint_positions_data = joint_positions_data.to_numpy()
    padding_length = max_length - live_video_frames
    padding_mask = np.zeros((live_video_frames + padding_length))
    padding_mask[-padding_length:] = 1
    joint_positions_data_padded = np.pad(
        joint_positions_data,
        ((0, padding_length), (0, 0)),
        mode="constant",
        constant_values=0,
    )
    data.append(joint_positions_data_padded)
    padding_masks.append(padding_mask)
    data = np.array(data)
    padding_masks = np.array(padding_masks)

    data = np.nan_to_num(data)

    return (data, padding_masks)


def reorder_dataframe(df):
    df_cols = get_dataframe_cols()
    df = df.reindex(columns=df_cols)
    return df