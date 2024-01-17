# Importing necessary libraries
import pandas as pd
import numpy as np


# Function to get dataframe columns
def get_dataframe_cols():
    # Define a dictionary with keypoints and their corresponding indices
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
    # Initialize an empty list to store the column names for the dataframe
    df_cols = []
    # Iterate over the keypoint names in the dictionary
    for keypoint_name in KEYPOINT_DICT:
        # For each keypoint, append three columns to the dataframe: y-coordinate, x-coordinate, and confidence
        df_cols.append(f"{keypoint_name}_y")
        df_cols.append(f"{keypoint_name}_x")
        df_cols.append(f"{keypoint_name}_confidence")
    return df_cols


# Get all the columns from the dataframe
all_cols = get_dataframe_cols()
# Define the columns to be dropped
cols_drop = all_cols[:15]


# Function to prepare the data for machine learning model
def prepare_data(df, max_length):
    df = df.head(600)
    # Initialize empty lists for data and padding masks
    data = []
    padding_masks = []
    # Get the number of frames in the live video
    live_video_frames = df.shape[0]
    # Drop the unnecessary columns from the dataframe
    joint_positions_data = df.drop(cols_drop, axis=1)
    # Convert the dataframe to a numpy array
    joint_positions_data = joint_positions_data.to_numpy()
    # Calculate the padding length
    padding_length = max_length - live_video_frames
    # Create a padding mask of zeros
    padding_mask = np.zeros((live_video_frames + padding_length))
    # Set the last 'padding_length' elements of the padding mask to 1
    padding_mask[-padding_length:] = 1
    # Pad the joint positions data with zeros
    joint_positions_data_padded = np.pad(
        joint_positions_data,
        ((0, padding_length), (0, 0)),
        mode="constant",
        constant_values=0,
    )
    # Append the padded data and padding mask to their respective lists
    data.append(joint_positions_data_padded)
    padding_masks.append(padding_mask)
    # Convert the lists to numpy arrays
    data = np.array(data)
    padding_masks = np.array(padding_masks)
    # Replace any NaN values in the data with zero
    data = np.nan_to_num(data)
    # Return the data and padding masks
    return (data, padding_masks)


# Function to reorder the columns of the dataframe
def reorder_dataframe(df):
    # Get the correct order of columns
    df_cols = get_dataframe_cols()
    # Reorder the columns of the dataframe
    df = df.reindex(columns=df_cols)
    return df
