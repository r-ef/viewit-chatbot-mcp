import sqlite3
import pandas as pd
from pathlib import Path

database_path = Path('transactions.db')
csv_path = Path('transactions-2025-10-15.csv')


def create_table(conn: sqlite3.Connection) -> None:
    conn.execute(f'''
        CREATE TABLE IF NOT EXISTS transactions (
        TRANSACTION_NUMBER TEXT PRIMARY KEY,
        INSTANCE_DATE TEXT,
        GROUP_EN TEXT,
        PROCEDURE_EN TEXT,
        IS_OFFPLAN_EN TEXT,
        IS_FREE_HOLD_EN TEXT,
        USAGE_EN TEXT,
        AREA_EN TEXT,
        PROP_TYPE_EN TEXT,
        PROP_SB_TYPE_EN TEXT,
        TRANS_VALUE REAL,
        PROCEDURE_AREA REAL,
        ACTUAL_AREA REAL,
        ROOMS_EN TEXT,
        PARKING TEXT,
        NEAREST_METRO_EN TEXT,
        NEAREST_MALL_EN TEXT,
        NEAREST_LANDMARK_EN TEXT,
        TOTAL_BUYER INTEGER,
        TOTAL_SELLER INTEGER,
        MASTER_PROJECT_EN TEXT,
        PROJECT_EN TEXT
    );
    ''')
    conn.commit()


def csv_to_df(csv_path: Path) -> pd.DataFrame:
    df = pd.read_csv(csv_path)
    for col in ['TRANS_VALUE', 'PROCEDURE_AREA', 'ACTUAL_AREA']:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce')
    for col in ['TOTAL_BUYER', 'TOTAL_SELLER']:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0).astype('Int64')
    return df


def insert_df(conn: sqlite3.Connection, df: pd.DataFrame) -> int:
    placeholders = ','.join(['?'] * len(df.columns))
    columns = ','.join(df.columns)
    assignments = ','.join([f"{col}=excluded.{col}" for col in df.columns if col != 'TRANSACTION_NUMBER'])
    sql = f"""
            INSERT INTO transactions ({columns})
            VALUES ({placeholders})
            ON CONFLICT(TRANSACTION_NUMBER) DO UPDATE SET {assignments};
            """
    cur = conn.cursor()
    cur.executemany(sql, df.where(pd.notnull(df), None).to_records(index=False))
    conn.commit()
    return cur.rowcount


def main() -> None:
    if not csv_path.exists():
        raise FileNotFoundError()
    conn = sqlite3.connect(database_path)
    try:
        create_table(conn)
        df = csv_to_df(csv_path)
        affected = insert_df(conn, df)
        print(f'inserted {affected} rows')
    finally:
        conn.close()


if __name__ == '__main__':
    main()