# Importing necessary libraries
import pandas as pd
import numpy as np
from joint_features import get_es1_features


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
def prepare_data(df, max_length, exercise_id):
    df = df.head(600)
    live_video_frames = df.shape[0]

    # Settings for training configuration
    smoothing_window=10
    use_joint_positions=False
    use_joint_features=False
    smooth_joint_positions=False
    smooth_joint_features=False
    
    if exercise_id == "Es1":
        use_joint_features=True
        smooth_joint_features=True
        smoothing_window=10
    
    elif exercise_id == "Es2":
        use_joint_positions=True

    elif exercise_id == "Es3":
        use_joint_positions=True
        smooth_joint_positions=True
        smoothing_window=10
    
    elif exercise_id == "Es4":
        use_joint_positions=True

    elif exercise_id == "Es5":
        use_joint_positions=True
        smooth_joint_positions=True
        smoothing_window=5

        
    data = []
    padding_masks = []
    joint_positions_data = None
    # Load joint positions data if needed
    if use_joint_positions:
        joint_positions_data = df
        joint_positions_data = joint_positions_data.drop(cols_drop, axis=1)
        if smooth_joint_positions:
            for col in joint_positions_data.columns:
                joint_positions_data[col] = joint_positions_data[col].rolling(smoothing_window).mean()
        joint_positions_data = joint_positions_data.to_numpy()

    joint_features_data = None
    # Load joint features data if needed
    if use_joint_features:
        joint_features_data = get_es1_features(df)
        if smooth_joint_features:
            for col in joint_features_data.columns:
                joint_features_data[col] = joint_features_data[col].rolling(smoothing_window).mean()
        joint_features_data = joint_features_data.to_numpy()

    data_to_use = None
    # Combine data if both are needed
    if use_joint_positions:
        data_to_use = joint_positions_data
    else:
        data_to_use = joint_features_data

    # Pad data to fixed length and create padding masks
    padding_length = max_length - live_video_frames
    padding_mask = np.zeros((live_video_frames + padding_length))
    padding_mask[-padding_length:] = 1 # Set padding elements to 1

    # Pad data with zeros
    data_to_use_padded = np.pad(data_to_use, ((0, padding_length), (0, 0)), mode='constant', constant_values=0)

    data.append(data_to_use_padded)
    padding_masks.append(padding_mask)
        
    data = np.array(data)
    padding_masks = np.array(padding_masks)

    data = np.nan_to_num(data) # Replace NaN values with numerical equivalents

    return (data, padding_masks)


# Function to reorder the columns of the dataframe
def reorder_dataframe(df):
    # Get the correct order of columns
    df_cols = get_dataframe_cols()
    # Reorder the columns of the dataframe
    df = df.reindex(columns=df_cols)
    return df
