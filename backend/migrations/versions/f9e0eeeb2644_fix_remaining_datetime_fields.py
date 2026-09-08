"""fix remaining datetime fields

Revision ID: f9e0eeeb2644
Revises: 7f0e157b2377
Create Date: 2026-09-07 13:06:12.970001

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = 'f9e0eeeb2644'
down_revision: Union[str, Sequence[str], None] = '7f0e157b2377'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_USING_TO_DATETIME = 'created_at::timestamp without time zone'


def _to_datetime(table: str, column: str, nullable: bool):
    op.alter_column(
        table, column,
        existing_type=sa.VARCHAR(),
        type_=sa.DateTime(),
        nullable=nullable,
        postgresql_using=f'{column}::timestamp without time zone',
    )


def _to_varchar(table: str, column: str, nullable: bool):
    op.alter_column(
        table, column,
        existing_type=sa.DateTime(),
        type_=sa.VARCHAR(),
        nullable=nullable,
        postgresql_using=f'{column}::varchar',
    )


def upgrade() -> None:
    """Upgrade schema."""
    _to_datetime('audit_logs', 'created_at', nullable=False)
    _to_datetime('deployments', 'deployed_at', nullable=False)
    _to_datetime('idempotency_keys', 'created_at', nullable=False)
    _to_datetime('idempotency_keys', 'expires_at', nullable=False)
    _to_datetime('incidents', 'triggered_at', nullable=False)
    _to_datetime('incidents', 'acknowledged_at', nullable=True)
    _to_datetime('incidents', 'resolved_at', nullable=True)
    _to_datetime('on_call_schedules', 'starts_at', nullable=False)
    _to_datetime('on_call_schedules', 'ends_at', nullable=False)
    _to_datetime('on_call_schedules', 'created_at', nullable=False)
    _to_datetime('organization_members', 'joined_at', nullable=False)
    _to_datetime('service_checks', 'checked_at', nullable=False)


def downgrade() -> None:
    """Downgrade schema."""
    _to_varchar('service_checks', 'checked_at', nullable=True)
    _to_varchar('organization_members', 'joined_at', nullable=True)
    _to_varchar('on_call_schedules', 'created_at', nullable=True)
    _to_varchar('on_call_schedules', 'ends_at', nullable=False)
    _to_varchar('on_call_schedules', 'starts_at', nullable=False)
    _to_varchar('incidents', 'resolved_at', nullable=True)
    _to_varchar('incidents', 'acknowledged_at', nullable=True)
    _to_varchar('incidents', 'triggered_at', nullable=True)
    _to_varchar('idempotency_keys', 'expires_at', nullable=False)
    _to_varchar('idempotency_keys', 'created_at', nullable=True)
    _to_varchar('deployments', 'deployed_at', nullable=True)
    _to_varchar('audit_logs', 'created_at', nullable=True)