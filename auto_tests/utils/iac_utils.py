import json


def get_iac_output(iac_output_path: str) -> dict:
    """
    reads pulumi output from JSON file on local FS

    @return: dictionary of pulumi outputs
    """
    with open(f"{iac_output_path}", "r") as read_file:
        return json.load(read_file)
